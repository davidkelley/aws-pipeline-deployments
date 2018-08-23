import { CodePipeline } from 'aws-sdk';

import { AWS_REGION as region } from '../constants';

const GITHUB = 'GitHub';

const sources = ({ stages }) =>
  stages
    .map(({ actions }) => actions)
    .reduce((arr, el) => [...el, ...arr], [])
    .filter(({ actionTypeId: { provider } }) => provider === GITHUB)
    .map(({ configuration: { Owner: owner, Repo: repo, Branch: branch } }) => ({
      name: `${owner}/${repo}`,
      owner,
      repo,
      branch,
    }));

export default async params => {
  const codepipeline = new CodePipeline({ region });
  const { pipeline } = await codepipeline.getPipeline(params).promise();
  return sources(pipeline);
};
