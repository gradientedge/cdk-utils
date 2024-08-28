import { ScalingSchedule } from 'aws-cdk-lib/aws-applicationautoscaling'
import {
  AwsLogDriverProps,
  ClusterProps,
  HealthCheck as FargateHealthCheck,
  MountPoint,
  TaskDefinitionProps,
} from 'aws-cdk-lib/aws-ecs'
import { ApplicationLoadBalancedFargateServiceProps } from 'aws-cdk-lib/aws-ecs-patterns'
import { HealthCheck as ElbHealthCheck } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { ResourceNameFormatterProps } from '../../common'
import { TagProps } from '../../types'

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
export interface HealthCheck extends ElbHealthCheck {
  intervalInSecs: number
  timeoutInSecs: number
}

/**
 *
 */
export interface EcsApplicationLoadBalancedFargateServiceHealthCheck extends FargateHealthCheck {
  intervalInSecs: number
  timeoutInSecs: number
}

/**
 */
export interface EcsApplicationLoadBalancedFargateServiceProps extends ApplicationLoadBalancedFargateServiceProps {
  healthCheck?: EcsApplicationLoadBalancedFargateServiceHealthCheck
  logging?: AwsLogDriverProps
  mountPoints?: MountPoint[]
  siteScaling?: EcsScalingProps
  resourceNameOptions?: ResourceNameFormatterProps
}
