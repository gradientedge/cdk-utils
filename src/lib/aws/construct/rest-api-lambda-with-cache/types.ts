import { RestApiLambdaProps } from '../rest-api-lambda/index.js'
import { ReplicatedElastiCacheProps, VpcProps } from '../../services/index.js'

/**
 */
export interface RestApiLambdaWithCacheProps extends RestApiLambdaProps {
  restApiCache: ReplicatedElastiCacheProps
  restApiVpc: VpcProps
  securityGroupExportName: string
  useExistingVpc: boolean
  vpcName?: string
}
