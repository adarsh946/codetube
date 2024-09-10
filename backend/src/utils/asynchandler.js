//  this is basically kind of a wrapper function which will be used many times while writing database..

const asyncHandler = (requestHandler) => {
  return (req, res, next) =>
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
};

export { asyncHandler };
