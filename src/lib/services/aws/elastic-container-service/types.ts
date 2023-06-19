import { TagProps } from '../../../types'
import { AwsLogDriverProps, ClusterProps, MountPoint, TaskDefinitionProps } from 'aws-cdk-lib/aws-ecs'
import { ScalingSchedule } from 'aws-cdk-lib/aws-applicationautoscaling'
import { ApplicationLoadBalancedFargateServiceProps } from 'aws-cdk-lib/aws-ecs-patterns'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'

/**
 * @category cdk-utils.ecs-manager
 * @subcategory Properties
 */
export interface EcsClusterProps extends ClusterProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.ecs-manager
 * @subcategory Properties
 */
export interface EcsTaskProps extends TaskDefinitionProps {
  logging?: AwsLogDriverProps
  tags?: TagProps[]
}

export interface EcsScalingProps {
  minCapacity?: number
  maxCapacity?: number
  scaleOnCpuUtilization?: number
  scaleOnMemoryUtilization?: number
  scaleOnRequestsPerTarget?: number
  scaleOnSchedule?: ScalingSchedule
}

/**
 * @category cdk-utils.site-with-ecs-backend
 * @subcategory Properties
 */
export interface HealthCheck extends elb.HealthCheck {
  intervalInSecs: number
  timeoutInSecs: number
}

/**
 * @category cdk-utils.ecs-manager
 * @subcategory Properties
 */
export interface EcsApplicationLoadBalancedFargateServiceProps extends ApplicationLoadBalancedFargateServiceProps {
  healthCheck?: HealthCheck
  logging?: AwsLogDriverProps
  mountPoints?: MountPoint[]
  siteScaling?: EcsScalingProps
}
