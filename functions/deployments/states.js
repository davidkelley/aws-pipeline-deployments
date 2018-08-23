import needle from 'needle';
import { withParameters } from '@aerofer/utils';

import { save, deployment } from './table';

import { GITHUB_TOKEN, ENVIRONMENT_NAME } from '../constants';

const ALIAS = 'GITHUB_TOKEN';

const push = ({ [ALIAS]: token }, url, body) => {
  const opts = { json: true, headers: { Authorization: `token ${token}` } };
  return needle('post', url, body, opts);
};

const request = withParameters({ [ALIAS]: GITHUB_TOKEN })(push);

const findOrCreate = async ({ executionId, name, branch }) => {
  const id = await deployment(name, executionId);
  if (!id) {
    const {
      body: { id: deploymentId },
    } = await request(`https://api.github.com/repos/${name}/deployments`, {
      environment: ENVIRONMENT_NAME,
      ref: branch,
    });
    await save(name, executionId, deploymentId);
    return deploymentId;
  }
  return id;
};

const status = state => ({ executionId, repositories: repos }) =>
  Promise.all(
    repos.map(async ({ name, branch }) => {
      const id = await findOrCreate({ name, branch, executionId });
      const url = `https://api.github.com/repos/${name}/deployments/${id}/statuses`;
      await request(url, { state });
      return id;
    })
  );

export default {
  CANCELED: status('error'),
  FAILED: status('failure'),
  RESUMED: status('pending'),
  STARTED: status('pending'),
  SUCCEEDED: status('success'),
  SUPERCEDED: status('pending'),
};
