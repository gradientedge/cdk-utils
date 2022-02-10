import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { GraphQLApiLambda } from '..'
import { GraphQlApiLambdaWithCacheProps } from '../../types'

/**
 * @stability stable
 * @category cdk-utils.graphql-api-lambda-with-cache
 * @subcategory construct
 * @classdesc Provides a construct to create and deploy a Graphql API as Lambda with Caching
 *
 * <b>Architecture</b> ![Architecture](./GraphQLApiLambda.jpg)
 *
 * @example
 * import { GraphQlApiLambdaWithCacheProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends GraphQLApiLambdaWithCache {
 *   constructor(parent: Construct, id: string, props: GraphQlApiLambdaWithCacheProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class GraphQLApiLambdaWithCache extends GraphQLApiLambda {
  /* graphql restApi props */
  props: GraphQlApiLambdaWithCacheProps
  id: string

  /* graphql restApi resources */
  graphQLVpc: ec2.Vpc
  graphQLElastiCache: elasticache.CfnCacheCluster
  graphQLSecurityGroup: ec2.ISecurityGroup
  securityGroupStackName: string
  securityGroupExportName: string

  constructor(parent: Construct, id: string, props: GraphQlApiLambdaWithCacheProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  protected initResources() {
    this.setVpc()
    this.setSecurityGroup()
    this.createElastiCache()
    super.initResources()
  }

  /**
   * Create VPC
   * @protected
   */
  protected setVpc() {
    this.graphQLVpc = this.vpcManager.createCommonVpc(this, this.props.graphQLVpc, this.props.graphQLVpc.vpcName)
  }

  /**
   * Resolve Security Group
   * @protected
   */
  protected setSecurityGroup() {
    this.graphQLSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      `${this.id}`,
      cdk.Fn.importValue(`${this.securityGroupStackName}-${this.props.stage}-${this.securityGroupExportName}`)
    )
  }

  /**
   * Create ElastiCache
   * @protected
   */
  protected createElastiCache() {
    this.graphQLElastiCache = this.elasticacheManager.createElastiCache(
      `${this.id}-elasticache`,
      this,
      this.props.graphQLElastiCache,
      this.graphQLVpc.privateSubnets.map(subnet => subnet.subnetId),
      [this.graphQLSecurityGroup.toString()]
    )
  }

  /**
   * Create Lambda Role
   * @protected
   */
  protected createLambdaRole() {
    super.createLambdaRole()

    this.graphQLApiLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
    )
  }

  /**
   * @summary Method to create environment variables for GraphQL Lambda function
   * @protected
   */
  protected createLambdaEnvironment() {
    this.graphQLApiLambdaEnvironment = {
      CACHE_REDIS_HOST: `${this.graphQLElastiCache.attrRedisEndpointAddress}`,
      CACHE_REDIS_PORT: `${this.graphQLElastiCache.attrRedisEndpointPort}`,
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
    }
  }

  protected createLambdaFunction() {
    this.graphQLApiLambdaFunction = this.lambdaManager.createLambdaFunction(
      `${this.id}-graphql-server`,
      this,
      this.props.graphqlApi,
      this.graphQLApiLambdaRole,
      this.graphQLApiLambdaLayers,
      this.props.graphQLApiSource,
      this.props.graphQLApiHandler || 'index.handler',
      this.graphQLApiLambdaEnvironment,
      this.graphQLVpc,
      [this.graphQLSecurityGroup],
      undefined,
      undefined,
      this.graphQLVpc
    )
  }
}
