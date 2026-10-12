const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    error.name = 'ValidationError';
    return next(error);
  }

  req[property] = value;
  return next();
};

module.exports = validate;
