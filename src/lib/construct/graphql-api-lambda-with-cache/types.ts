import { GraphQlApiLambdaProps } from '../graphql-api-lambda'
import { VpcProps } from 'aws-cdk-lib/aws-ec2'
import { ReplicatedElastiCacheProps } from '../../services'

/**
 * @deprecated Use RestApiLambdaWithCacheProps instead. This will be removed in a future release.
 */
export interface GraphQlApiLambdaWithCacheProps extends GraphQlApiLambdaProps {
  graphQLElastiCache: ReplicatedElastiCacheProps
  graphQLVpc: VpcProps
  securityGroupExportName: string
  useExistingVpc: boolean
  vpcName?: string
}
