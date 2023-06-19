import { RestApiLambdaProps } from '../rest-api-lambda'
import { VpcProps } from 'aws-cdk-lib/aws-ec2'
import { ReplicatedElastiCacheProps } from '../../services'

/**
 * @category cdk-utils.rest-api-lambda-with-cache
 * @subcategory Properties
 */
export interface RestApiLambdaWithCacheProps extends RestApiLambdaProps {
  restApiVpc: VpcProps
  restApiCache: ReplicatedElastiCacheProps
  securityGroupExportName: string
  useExistingVpc: boolean
  vpcName?: string
}
