import { TopicProps } from 'aws-cdk-lib/aws-sns'

/**
 * Properties for configuring an AWS SNS topic subscription.
 * @see [CDK SNS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sns-readme.html}
 */
/** @category Interface */
export interface SubscriptionProps extends TopicProps {}
