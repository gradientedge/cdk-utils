import { RestApiLambdaProps } from '../rest-api-lambda'
import { ReplicatedElastiCacheProps, VpcProps } from '../../services'

/**
 */
export interface RestApiLambdaWithCacheProps extends RestApiLambdaProps {
  restApiCache: ReplicatedElastiCacheProps
  restApiVpc: VpcProps
  securityGroupExportName: string
  useExistingVpc: boolean
  vpcName?: string
}
