const UNITS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

/** Converts strings like "15m", "12h" or "1d" into milliseconds. */
function toMs(value) {
  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) {
    throw new Error(`Invalid duration "${value}". Use values like 15m, 12h or 1d.`);
  }
  return Number(match[1]) * UNITS[match[2]];
}

module.exports = { toMs };
