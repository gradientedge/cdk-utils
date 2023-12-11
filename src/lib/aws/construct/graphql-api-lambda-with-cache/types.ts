import { ReplicatedElastiCacheProps, VpcProps } from '../../services'
import { GraphQlApiLambdaProps } from '../graphql-api-lambda'

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
