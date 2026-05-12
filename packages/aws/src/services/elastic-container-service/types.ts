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

import { TagProps } from '../../types/index.js'

/**
 * Properties for creating an ECS cluster.
 * @see {@link ClusterProps}
 */
/** @category Interface */
export interface EcsClusterProps extends ClusterProps {
  /** Optional tags to apply to the ECS cluster */
  tags?: TagProps[]
}

/**
 * Properties for creating an ECS task definition.
 * @see {@link TaskDefinitionProps}
 */
/** @category Interface */
export interface EcsTaskProps extends TaskDefinitionProps {
  /** Optional AWS log driver configuration for container logging */
  logging?: AwsLogDriverProps
  /** Optional tags to apply to the task definition */
  tags?: TagProps[]
}

/**
 * Properties for configuring ECS service auto-scaling.
 */
/** @category Interface */
export interface EcsScalingProps {
  /** Maximum number of tasks to scale out to */
  maxCapacity?: number
  /** Minimum number of tasks to maintain */
  minCapacity?: number
  /** Target CPU utilization percentage for scaling */
  scaleOnCpuUtilization?: number
  /** Target memory utilization percentage for scaling */
  scaleOnMemoryUtilization?: number
  /** Target number of requests per target for scaling */
  scaleOnRequestsPerTarget?: number
  /** Schedule-based scaling configuration */
  scaleOnSchedule?: ScalingSchedule
}

/**
 * Health check configuration for ELB-based health checks with interval and timeout in seconds.
 * @see {@link ElbHealthCheck}
 */
/** @category Interface */
export interface HealthCheck extends ElbHealthCheck {
  /** Health check interval in seconds */
  intervalInSecs: number
  /** Health check timeout in seconds */
  timeoutInSecs: number
}

/**
 * Health check configuration for Application Load Balanced Fargate services with interval and timeout in seconds.
 * @see {@link FargateHealthCheck}
 */
/** @category Interface */
export interface EcsApplicationLoadBalancedFargateServiceHealthCheck extends FargateHealthCheck {
  /** Health check interval in seconds */
  intervalInSecs: number
  /** Health check timeout in seconds */
  timeoutInSecs: number
}

/**
 * Properties for creating an Application Load Balanced Fargate service.
 * @see {@link ApplicationLoadBalancedFargateServiceProps}
 */
/** @category Interface */
export interface EcsApplicationLoadBalancedFargateServiceProps extends ApplicationLoadBalancedFargateServiceProps {
  /** Optional health check configuration for the Fargate service */
  healthCheck?: EcsApplicationLoadBalancedFargateServiceHealthCheck
  /** Optional AWS log driver configuration for container logging */
  logging?: AwsLogDriverProps
  /** Optional mount points for container volumes */
  mountPoints?: MountPoint[]
  /** Optional auto-scaling configuration for the service */
  siteScaling?: EcsScalingProps
}
