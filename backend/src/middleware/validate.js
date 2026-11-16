const ApiError = require('../utils/ApiError');

/**
 * validate({ params, query, body }) -> middleware.
 * Parsed (typed, trimmed, defaulted) values replace the raw input. The validated
 * query is exposed as req.validatedQuery.
 */
module.exports = (schemas) => (req, res, next) => {
  const errors = [];

  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;

    const result = schemas[part].safeParse(req[part] ?? {});
    if (result.success) {
      if (part === 'query') req.validatedQuery = result.data;
      else req[part] = result.data;
    } else {
      for (const issue of result.error.issues) {
        errors.push({ field: issue.path.join('.') || part, message: issue.message });
      }
    }
  }

  if (errors.length > 0) return next(ApiError.badRequest('Validation failed', errors));
  return next();
};
