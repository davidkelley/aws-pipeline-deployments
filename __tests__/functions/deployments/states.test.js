import faker from 'faker';
import nock from 'nock';
import { withParameters } from '@aerofer/utils';

import { deployment } from '@functions/deployments/table';
import states from '@functions/deployments/states';

const { ENVIRONMENT_NAME, GITHUB_TOKEN } = process.env;

jest.mock('@aerofer/utils');

jest.mock(
  '@functions/deployments/table',
  () => require('./__mocks__/table') // eslint-disable-line global-require
);

const STATUSES = {
  CANCELED: 'error',
  FAILED: 'failure',
  RESUMED: 'pending',
  STARTED: 'pending',
  SUCCEEDED: 'success',
  SUPERCEDED: 'pending',
};

describe('states', () => {
  const repository = () => ({
    name: `${faker.internet.userName()}/${faker.random.uuid()}`,
    branch: faker.random.arrayElement(['dev', 'staging', 'master']),
  });

  let executionId;

  let githubToken;

  beforeEach(() => {
    executionId = faker.random.uuid();
    githubToken = faker.random.uuid();
  });

  beforeEach(() => {
    withParameters.parameters = { [GITHUB_TOKEN]: githubToken };
  });

  afterEach(() => {
    expect(deployment).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    deployment.mockClear();
  });

  Object.keys(states).forEach(state => {
    describe(`Pipeline state "${state}"`, () => {
      const { [state]: fn } = states;

      let repositories;

      let deploymentId;

      let github;

      beforeEach(() => {
        deploymentId = faker.random.uuid();
      });

      beforeEach(() => {
        repositories = [repository()];
      });

      describe('when a deployment does not exist', () => {
        beforeEach(() => {
          const [{ name, branch: ref }] = repositories;
          github = nock('https://api.github.com')
            .matchHeader('Authorization', `token ${githubToken}`)
            .post(`/repos/${name}/deployments`, { ref, environment: ENVIRONMENT_NAME })
            .reply(200, { id: deploymentId })
            .matchHeader('Authorization', `token ${githubToken}`)
            .post(`/repos/${name}/deployments/${deploymentId}/statuses`, { state: STATUSES[state] })
            .reply(200, '');
        });

        beforeEach(() => {
          deployment.data = null;
        });

        it('creates and updates the status of a deployment', () =>
          expect(fn({ executionId, repositories })).resolves.toEqual(
            expect.arrayContaining([deploymentId])
          ));

        afterEach(() => {
          const [{ name }] = repositories;
          expect(deployment).toHaveBeenCalledWith(name, executionId);
        });

        afterEach(() => {
          expect(github.isDone()).toBe(true);
        });
      });

      describe('when a deployment already exists', () => {
        beforeEach(() => {
          const [{ name }] = repositories;
          github = nock('https://api.github.com')
            .matchHeader('Authorization', `token ${githubToken}`)
            .post(`/repos/${name}/deployments/${deploymentId}/statuses`, { state: STATUSES[state] })
            .reply(200, '');
        });

        beforeEach(() => {
          deployment.data = deploymentId;
        });

        it('updates the status of the deployment', () =>
          expect(fn({ executionId, repositories })).resolves.toEqual(
            expect.arrayContaining([deploymentId])
          ));

        afterEach(() => {
          const [{ name }] = repositories;
          expect(deployment).toHaveBeenCalledWith(name, executionId);
        });

        afterEach(() => {
          expect(github.isDone()).toBe(true);
        });
      });
    });
  });
});
