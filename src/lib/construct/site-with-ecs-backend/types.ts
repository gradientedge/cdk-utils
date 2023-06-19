import { CommonStackProps } from '../../common'
import {
  AcmProps,
  CloudfrontFunctionProps,
  DistributionProps,
  EcsApplicationLoadBalancedFargateServiceProps,
  EcsClusterProps,
  EfsAccessPointOptions,
  EfsFileSystemProps,
  HealthCheck,
  LogProps,
  S3BucketProps,
} from '../../services'
import { VpcProps } from 'aws-cdk-lib/aws-ec2'

/**
 * @category cdk-utils.site-with-ecs-backend
 * @subcategory Properties
 */
export interface SiteWithEcsBackendProps extends CommonStackProps {
  siteCacheInvalidationDockerFilePath?: string
  siteHealthCheck: HealthCheck
  siteCertificate: AcmProps
  siteRegionalCertificate: AcmProps
  siteCluster: EcsClusterProps
  siteDistribution: DistributionProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteFunctionFilePath?: string
  siteEcsContainerImagePath: string
  siteLog: LogProps
  siteLogBucket: S3BucketProps
  siteRecordName?: string
  siteSubDomain: string
  siteTask: EcsApplicationLoadBalancedFargateServiceProps
  siteVpc: VpcProps
  siteFileSystem?: EfsFileSystemProps
  siteFileSystemAccessPoints?: EfsAccessPointOptions[]
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}
