export const get = jest.fn(async () => get.data);

get.data = {};

export const save = jest.fn(async () => save.data);

save.data = {};

export const deployment = jest.fn(async () => deployment.data);

deployment.data = {};
