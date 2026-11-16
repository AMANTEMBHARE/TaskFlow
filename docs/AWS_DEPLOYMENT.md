# Deploying TaskFlow on AWS EC2 (Stage 1: Node.js + PM2 + Nginx)

This is a hands-on guide. Do every step yourself and read what each command does.

```
Internet -> EC2 public IP -> Nginx :80/:443 -+-> /      static React build
                                             +-> /api/  -> Express 127.0.0.1:5000 (PM2) -> MongoDB Atlas
```

## 0. Before you start

- The code is in a GitHub repository you can clone from (use a private repo or a deploy key, or a public repo for practice).
- A MongoDB Atlas cluster, database user and connection string (see the README).
- An AWS account. A `t3.micro` or `t2.micro` (free-tier eligible, 1 GB RAM) is enough to run the app.

## 1. Launch the EC2 instance

1. EC2 -> **Launch instance**. Name: `taskflow`.
2. AMI: **Ubuntu Server 24.04 LTS**. Instance type: `t3.micro` (or `t2.micro`).
3. **Key pair:** create one (RSA, `.pem`) and download it. AWS shows it only once.
4. **Security group** (the instance firewall). Inbound rules:

   | Type | Port | Source | Why |
   |---|---|---|---|
   | SSH | 22 | **My IP** (not `0.0.0.0/0`) | Admin access |
   | HTTP | 80 | `0.0.0.0/0` | Website |
   | HTTPS | 443 | `0.0.0.0/0` | Website over TLS (needed later) |

   Do **not** open port 5000. The API must stay private behind Nginx.
5. Storage: the default 8 GB is fine. Launch.
6. **Elastic IP:** allocate one and associate it with the instance. Otherwise the public IP changes on every stop/start, which breaks your Atlas IP allow-list and your DNS record.

## 2. Connect with SSH

On your computer:

```bash
chmod 400 ~/Downloads/taskflow-key.pem
ssh -i ~/Downloads/taskflow-key.pem ubuntu@<ELASTIC_IP>
```

If it times out, your IP in the security group probably changed (home IPs often do). Update the SSH rule.

## 3. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 22 (NodeSource), Nginx, Git, rsync
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git rsync
node -v && npm -v && nginx -v

# PM2 process manager
sudo npm install -g pm2
```

**Small instance tip (1 GB RAM):** building the frontend can run out of memory. Add swap once:

```bash
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Get the code

```bash
cd ~
git clone https://github.com/<your-user>/<your-repo>.git taskflow
cd taskflow
```

## 5. Allow the server in MongoDB Atlas

Atlas -> **Network Access** -> add the instance's **Elastic IP** (`x.x.x.x/32`). Without this the API cannot connect and `/api/v1/health` returns 503.

## 6. Configure the backend

```bash
cd ~/taskflow/backend
cp .env.example .env
nano .env
```

Set at least:

```
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
TRUST_PROXY=1
MONGODB_URI=<your Atlas connection string>
JWT_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
JWT_EXPIRES_IN=1d
COOKIE_SECURE=false        # IMPORTANT: stays false until HTTPS works (see section 10)
FRONTEND_URL=http://<ELASTIC_IP>
```

Lock the file down: `chmod 600 .env`.

Install dependencies and test it by hand first:

```bash
npm ci --omit=dev
node src/server.js          # should print "TaskFlow API listening" - stop it with Ctrl+C
```

## 7. Build the frontend and publish it

```bash
cd ~/taskflow/frontend
npm ci
npm run build

sudo mkdir -p /var/www/taskflow
sudo rsync -a --delete dist/ /var/www/taskflow/
```

## 8. Run the API with PM2

```bash
cd ~/taskflow
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 status
pm2 logs taskflow-api --lines 30

# Start automatically after a reboot:
pm2 save
pm2 startup          # run the sudo command it prints, then: pm2 save
```

Check locally on the server: `curl http://127.0.0.1:5000/api/v1/health` should return `"status":"ok"`.

## 9. Configure Nginx

```bash
sudo cp ~/taskflow/deploy/nginx/taskflow.conf /etc/nginx/sites-available/taskflow
sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/taskflow
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t                  # always test the config before reloading
sudo systemctl reload nginx
```

Verify:

```bash
bash ~/taskflow/deploy/scripts/smoke.sh
```

Then open `http://<ELASTIC_IP>` in your browser, register and create a task.

## 10. Domain and HTTPS

1. Buy or use a domain. Create an **A record** pointing it to the Elastic IP (Route 53 or your registrar). Wait for DNS (`dig +short your-domain.com`).
2. Edit `/etc/nginx/sites-available/taskflow`: change `server_name _;` to `server_name your-domain.com;`, then `sudo nginx -t && sudo systemctl reload nginx`.
3. Get a free certificate from Let's Encrypt:

   ```bash
   sudo snap install --classic certbot
   sudo ln -s /snap/bin/certbot /usr/bin/certbot
   sudo certbot --nginx -d your-domain.com
   ```

   Certbot edits the Nginx config (HTTPS block + HTTP-to-HTTPS redirect) and sets up automatic renewal. Test renewal with `sudo certbot renew --dry-run`.
4. Now switch cookies to secure mode:

   ```bash
   nano ~/taskflow/backend/.env      # COOKIE_SECURE=true and FRONTEND_URL=https://your-domain.com
   pm2 restart taskflow-api --update-env
   ```

   Do this only after HTTPS works, otherwise logins will silently fail.

## 11. Deploying updates

After pushing changes to GitHub, on the server:

```bash
bash ~/taskflow/deploy/scripts/deploy.sh
```

It pulls, installs, builds, publishes the frontend, reloads PM2 and runs the smoke check. **Rollback by hand:** `git -C ~/taskflow log --oneline`, then `git -C ~/taskflow checkout <good-commit>` and run the script's install/build steps again (CI/CD in Stage 3 will automate this properly).

## 12. Everyday commands and troubleshooting

| Task | Command |
|---|---|
| API status / logs | `pm2 status`, `pm2 logs taskflow-api` |
| Restart API | `pm2 restart taskflow-api --update-env` |
| Nginx errors | `sudo tail -n 50 /var/log/nginx/error.log` |
| Nginx access log | `sudo tail -f /var/log/nginx/access.log` |
| Test Nginx config | `sudo nginx -t` |
| What listens where | `sudo ss -tlnp` (5000 must show `127.0.0.1`, not `0.0.0.0`) |
| Disk / memory | `df -h`, `free -m` |

| Symptom | Likely cause |
|---|---|
| Browser can't reach the site at all | Security group lacks port 80, or Nginx is not running (`systemctl status nginx`) |
| 502 Bad Gateway | API is down: `pm2 status`, `pm2 logs`; or wrong port in Nginx |
| `/api/v1/health` returns 503 | Atlas unreachable: IP not allow-listed, wrong `MONGODB_URI`, or special characters in the password not URL-encoded |
| Login "works" but you land back on the login page | `COOKIE_SECURE=true` over plain HTTP |
| Page refresh gives 404 | Nginx `try_files ... /index.html` fallback is missing |
| 429 Too many attempts | Auth rate limit hit; wait 15 minutes. If it triggers for everyone, `TRUST_PROXY=1` is missing |
| Build killed / `Killed` message | Out of memory: add swap (section 3) |

## 13. Basic hardening checklist (do these as you learn)

- SSH rule limited to your IP; password SSH login disabled (Ubuntu cloud images already do this)
- `sudo apt install unattended-upgrades` for automatic security updates
- `backend/.env` is `chmod 600` and never committed
- Optional host firewall: `sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable` (add the SSH rule first or you lock yourself out)
- Stop the instance when not practicing to avoid charges; remember an Elastic IP that is **not** attached to a running instance is billed
