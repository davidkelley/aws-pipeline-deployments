import AWS from 'aws-sdk-mock';
import faker from 'faker';

import { save, get, deployment } from '@functions/deployments/table';

jest.unmock('@functions/deployments/table');

describe('table', () => {
  const generator = () => ({
    deployment: faker.random.uuid(),
    repository: `${faker.internet.userName}/${faker.random.word()}`,
    id: faker.random.uuid(),
  });

  afterEach(() => AWS.restore());

  describe('#save', () => {
    const mockPut = jest.fn();

    beforeEach(() => {
      AWS.mock('DynamoDB.DocumentClient', 'put', mockPut);
    });

    afterEach(() => {
      expect(mockPut).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      mockPut.mockClear();
    });

    expect(save).toEqual(expect.any(Function));

    describe('when the request is valid', () => {
      const { deployment: deploymentId, repository, id } = generator();

      beforeEach(() => mockPut.mockImplementationOnce((_, cb) => cb(null, {})));

      it('executes successfully', () =>
        expect(save(repository, id, deploymentId)).resolves.toEqual({}));

      afterEach(() => {
        expect(mockPut).toHaveBeenCalledWith(
          expect.objectContaining({
            Item: {
              repository,
              execution_id: id,
              deployment_id: deploymentId,
              expires: expect.any(Number),
            },
          }),
          expect.any(Function)
        );
      });
    });
  });

  describe('#get', () => {
    const mockGet = jest.fn();

    beforeEach(() => {
      AWS.mock('DynamoDB.DocumentClient', 'get', mockGet);
    });

    afterEach(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      mockGet.mockClear();
    });

    expect(get).toEqual(expect.any(Function));

    describe('when a record exists', () => {
      const { deployment: deploymentId, repository, id } = generator();

      let record;

      beforeEach(() => {
        record = {
          repository,
          execution_id: id,
          deployment_id: deploymentId,
          expires: expect.any(Number),
        };
      });

      beforeEach(() => mockGet.mockImplementationOnce((_, cb) => cb(null, { Items: [record] })));

      it('retrieves the record successfully', () =>
        expect(get(repository, id)).resolves.toEqual(
          expect.objectContaining({
            Items: expect.arrayContaining([record]),
          })
        ));

      afterEach(() => {
        expect(mockGet).toHaveBeenCalledWith(
          expect.objectContaining({
            Key: {
              repository,
              execution_id: id,
            },
          }),
          expect.any(Function)
        );
      });
    });

    describe('when a record does not exist', () => {
      const { repository, id } = generator();

      beforeEach(() => mockGet.mockImplementationOnce((_, cb) => cb(null, { Items: [] })));

      it('retrieves the record successfully', () =>
        expect(get(repository, id)).resolves.toEqual(
          expect.objectContaining({
            Items: [],
          })
        ));

      afterEach(() => {
        expect(mockGet).toHaveBeenCalledWith(
          expect.objectContaining({
            Key: {
              repository,
              execution_id: id,
            },
          }),
          expect.any(Function)
        );
      });
    });
  });

  describe('#deployment', () => {
    const mockGet = jest.fn();

    beforeEach(() => {
      AWS.mock('DynamoDB.DocumentClient', 'get', mockGet);
    });

    afterEach(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      mockGet.mockClear();
    });

    expect(deployment).toEqual(expect.any(Function));

    describe('when a record exists', () => {
      const { deployment: deploymentId, repository, id } = generator();

      let record;

      beforeEach(() => {
        record = {
          repository,
          execution_id: id,
          deployment_id: deploymentId,
          expires: expect.any(Number),
        };
      });

      beforeEach(() => mockGet.mockImplementationOnce((_, cb) => cb(null, { Items: [record] })));

      it('retrieves the record successfully', () =>
        expect(deployment(repository, id)).resolves.toEqual(deploymentId));
    });

    describe('when a record does not exist', () => {
      const { repository, id } = generator();

      beforeEach(() => mockGet.mockImplementationOnce((_, cb) => cb(null, { Items: null })));

      it('return a null value', () => expect(deployment(repository, id)).resolves.toEqual(null));
    });
  });
});
