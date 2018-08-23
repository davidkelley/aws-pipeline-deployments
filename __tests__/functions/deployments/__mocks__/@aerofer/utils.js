export const withParameters = map => fn => async (...args) => {
  const data = Object.keys(map).reduce(
    (obj, key) => ({
      [key]: withParameters.parameters[map[key]],
      ...obj,
    }),
    {}
  );
  return fn(data, ...args);
};

withParameters.parameters = {};
