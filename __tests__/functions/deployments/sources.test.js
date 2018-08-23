import AWS from 'aws-sdk-mock';
import faker from 'faker';

import sources from '@functions/deployments/sources';

const repository = () => ({
  owner: faker.internet.userName(),
  repo: faker.random.uuid(),
  branch: faker.random.arrayElement(['dev', 'staging', 'master']),
});

const generator = (actions = []) => ({
  pipeline: {
    stages: [{ actions }, { actions: [] }],
  },
});

describe('#sources', () => {
  const name = faker.random.uuid();

  const version = faker.random.number();

  const mockGetPipeline = jest.fn();

  beforeEach(() => AWS.mock('CodePipeline', 'getPipeline', mockGetPipeline));

  afterEach(() => AWS.restore());

  afterEach(() => {
    expect(mockGetPipeline).toHaveBeenCalledTimes(1);
    expect(mockGetPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.any(String),
        version: expect.any(Number),
      }),
      expect.any(Function)
    );
  });

  afterEach(() => mockGetPipeline.mockReset());

  describe('when the pipeline exists', () => {
    let structure;

    beforeEach(() => {
      mockGetPipeline.mockImplementationOnce((_, cb) => cb(null, structure));
    });

    describe('when there is a single GitHub source', () => {
      const { owner, repo, branch } = repository();

      beforeEach(() => {
        structure = generator([
          {
            actionTypeId: {
              provider: 'GitHub',
            },
            configuration: {
              Owner: owner,
              Repo: repo,
              Branch: branch,
            },
          },
        ]);
      });

      it('extracts the correct source', () =>
        expect(sources({ name, version })).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              owner,
              repo,
              branch,
            }),
          ])
        ));
    });

    describe('when there are multiple GitHub sources', () => {
      const repos = [repository(), repository()];

      beforeEach(() => {
        structure = generator(
          repos.map(({ owner, repo, branch }) => ({
            actionTypeId: {
              provider: 'GitHub',
            },
            configuration: {
              Owner: owner,
              Repo: repo,
              Branch: branch,
            },
          }))
        );
      });

      it('extracts the correct source', () =>
        expect(sources({ name, version })).resolves.toEqual(
          expect.arrayContaining(repos.map(expect.objectContaining))
        ));
    });

    describe('when there are no GitHub sources', () => {
      beforeEach(() => {
        structure = generator([]);
      });

      it('returns an empty array', () => expect(sources({ name, version })).resolves.toEqual([]));
    });
  });

  describe('when the pipeline does not exist', () => {
    const err = new Error(faker.random.words());

    beforeEach(() => mockGetPipeline.mockImplementationOnce((_, cb) => cb(err)));

    it('throws an error', () =>
      expect(sources({ name, version })).rejects.toEqual(expect.any(Error)));
  });
});
