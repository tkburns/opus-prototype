export const catchError = (fn: () => unknown) => {
  let error: unknown;

  try {
    fn();
  } catch (e) {
    error = e;
  }

  if (!error) {
    throw new Error('function did not throw an error like expected');
  }

  return error;
};
