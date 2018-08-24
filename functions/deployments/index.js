import sources from './sources';
import states from './states';

const EXECUTION_ID = 'execution-id';

/**
 * Main handler for the Lambda function. CodePipeline related CloudWatch Events
 * are passed to this handler for execution.
 *
 * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#codepipeline_event_type
 * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
 *
 * @example CloudWatch CodePipeline Event sample
 * ```
 * {
 *   "version": "0",
 *   "id": "CWE-event-id",
 *   "detail-type": "CodePipeline Pipeline Execution State Change",
 *   "source": "aws.codepipeline",
 *   "account": "123456789012",
 *   "time": "2017-04-22T03:31:47Z",
 *   "region": "us-east-1",
 *   "resources": [
 *     "arn:aws:codepipeline:us-east-1:123456789012:pipeline:myPipeline"
 *   ],
 *   "detail": {
 *     "pipeline": "myPipeline",
 *     "version": "1",
 *     "state": "STARTED",
 *     "execution-id": "01234567-0123-0123-0123-012345678901"
 *   }
 * }
 * ```
 */
export const handler = async ({
  detail: { pipeline, version, state, [EXECUTION_ID]: executionId },
}) =>
  states[state]({
    executionId,
    repositories: await sources({ name: pipeline, version }),
  });
