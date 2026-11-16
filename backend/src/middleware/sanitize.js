/**
 * Defence in depth against NoSQL operator injection. Strips keys that start with "$"
 * or contain "." from req.body, req.query and req.params. The zod validators already
 * reject non-string values where strings are expected; this catches anything missed.
 */
function strip(value) {
  if (Array.isArray(value)) {
    value.forEach(strip);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else strip(value[key]);
    }
  }
}

module.exports = (req, res, next) => {
  strip(req.body);
  strip(req.query);
  strip(req.params);
  next();
};
