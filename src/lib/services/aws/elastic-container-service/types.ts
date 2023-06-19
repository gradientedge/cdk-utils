import { TagProps } from '../../../types'
import { AwsLogDriverProps, ClusterProps, MountPoint, TaskDefinitionProps } from 'aws-cdk-lib/aws-ecs'
import { ScalingSchedule } from 'aws-cdk-lib/aws-applicationautoscaling'
import { ApplicationLoadBalancedFargateServiceProps } from 'aws-cdk-lib/aws-ecs-patterns'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'

/**
 */
export interface EcsClusterProps extends ClusterProps {
  tags?: TagProps[]
}

/**
 */
export interface EcsTaskProps extends TaskDefinitionProps {
  logging?: AwsLogDriverProps
  tags?: TagProps[]
}

export interface EcsScalingProps {
  maxCapacity?: number
  minCapacity?: number
  scaleOnCpuUtilization?: number
  scaleOnMemoryUtilization?: number
  scaleOnRequestsPerTarget?: number
  scaleOnSchedule?: ScalingSchedule
}

/**
 */
export interface HealthCheck extends elb.HealthCheck {
  intervalInSecs: number
  timeoutInSecs: number
}

/**
 */
export interface EcsApplicationLoadBalancedFargateServiceProps extends ApplicationLoadBalancedFargateServiceProps {
  healthCheck?: HealthCheck
  logging?: AwsLogDriverProps
  mountPoints?: MountPoint[]
  siteScaling?: EcsScalingProps
}
