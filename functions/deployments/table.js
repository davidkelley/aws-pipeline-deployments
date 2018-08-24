import { DynamoDB } from 'aws-sdk';

import { DEPLOYMENTS_TABLE as TableName, AWS_REGION as region } from '../constants';

const DEPLOYMENT_ID = 'deployment_id';

const EXECUTION_ID = 'execution_id';

const PUT = 'put';

const GET = 'get';

const expiry = () => ({ expires: Math.floor(new Date() / 1000) + 60 * 60 * 24 });

const client = (op, params) => {
  const service = new DynamoDB({ region });
  const doc = new DynamoDB.DocumentClient({ service, params: { TableName } });
  return doc[op](params).promise();
};

export const save = (repository, id, deployment) =>
  client(PUT, {
    Item: {
      repository,
      [EXECUTION_ID]: id,
      [DEPLOYMENT_ID]: deployment,
      ...expiry(),
    },
  });

export const get = (repository, id) =>
  client(GET, {
    Key: {
      repository,
      [EXECUTION_ID]: id,
    },
  });

export const deployment = async (...args) => {
  const { Items } = await get(...args);
  if (Items) {
    const [{ [DEPLOYMENT_ID]: id = null }] = Items;
    return id;
  }
  return null;
};
