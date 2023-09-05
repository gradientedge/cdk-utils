import { RestApiLambdaProps } from '../rest-api-lambda'
import { VpcProps } from 'aws-cdk-lib/aws-ec2'
import { ReplicatedElastiCacheProps } from '../../services'

/**
 */
export interface RestApiLambdaWithCacheProps extends RestApiLambdaProps {
  restApiCache: ReplicatedElastiCacheProps
  restApiVpc: VpcProps
  securityGroupExportName: string
  useExistingVpc: boolean
  vpcName?: string
}
