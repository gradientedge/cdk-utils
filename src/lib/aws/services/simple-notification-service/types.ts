import { TopicProps } from 'aws-cdk-lib/aws-sns'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface SubscriptionProps extends TopicProps {
  resourceNameOptions?: ResourceNameFormatterProps
}
