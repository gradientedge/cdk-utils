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
 */
export interface SiteWithEcsBackendProps extends CommonStackProps {
  logLevel: string
  nodeEnv: string
  siteCacheInvalidationDockerFilePath?: string
  siteCertificate: AcmProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteCluster: EcsClusterProps
  siteDistribution: DistributionProps
  siteEcsContainerImagePath: string
  siteFileSystem?: EfsFileSystemProps
  siteFileSystemAccessPoints?: EfsAccessPointOptions[]
  siteFunctionFilePath?: string
  siteHealthCheck: HealthCheck
  siteLog: LogProps
  siteLogBucket: S3BucketProps
  siteRecordName?: string
  siteRegionalCertificate: AcmProps
  siteSubDomain: string
  siteTask: EcsApplicationLoadBalancedFargateServiceProps
  siteVpc: VpcProps
  timezone: string
  useExistingHostedZone: boolean
  useExistingVpc: boolean
}
