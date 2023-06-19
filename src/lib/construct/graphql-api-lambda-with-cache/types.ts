import { GraphQlApiLambdaProps } from '../graphql-api-lambda'
import { VpcProps } from 'aws-cdk-lib/aws-ec2'
import { ReplicatedElastiCacheProps } from '../../services'

/**
 * @deprecated Use RestApiLambdaWithCacheProps instead. This will be removed in a future release.
 * @category cdk-utils.graphql-api-lambda-with-cache
 * @subcategory Properties
 */
export interface GraphQlApiLambdaWithCacheProps extends GraphQlApiLambdaProps {
  graphQLVpc: VpcProps
  graphQLElastiCache: ReplicatedElastiCacheProps
  securityGroupExportName: string
  useExistingVpc: boolean
  vpcName?: string
}
