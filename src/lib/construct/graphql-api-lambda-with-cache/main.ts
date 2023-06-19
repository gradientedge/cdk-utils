import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { GraphQLApiLambda } from '..'
import { GraphQlApiLambdaWithCacheProps } from './types'
import * as utils from '../../utils'

/**
 * @deprecated Use RestApiLambdaWithCache instead. This will be removed in a future release.
 *
 * @category cdk-utils.graphql-api-lambda-with-cache
 * @subcategory construct
 * @classdesc Provides a construct to create and deploy a Graphql API as Lambda with Caching
 *
 * <b>Architecture</b><br/> ![Architecture](./GraphQLApiLambda.jpg)
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
 * @mixin
 */
export class GraphQLApiLambdaWithCache extends GraphQLApiLambda {
  /* graphql restApi props */
  props: GraphQlApiLambdaWithCacheProps
  id: string

  /* graphql restApi resources */
  graphQLVpc: ec2.IVpc
  graphQLElastiCache: elasticache.CfnReplicationGroup
  graphQLSecurityGroup: ec2.ISecurityGroup
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
    if (this.props.useExistingVpc) {
      this.graphQLVpc = this.vpcManager.retrieveCommonVpc(`${this.id}`, this, this.props.vpcName)
    } else {
      this.graphQLVpc = this.vpcManager.createCommonVpc(this, this.props.graphQLVpc, this.props.graphQLVpc.vpcName)
    }
  }

  /**
   * Resolve Security Group
   * @protected
   */
  protected setSecurityGroup() {
    if (this.props.securityGroupExportName) {
      this.graphQLSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        `${this.id}`,
        cdk.Fn.importValue(this.props.securityGroupExportName)
      )
    } else {
      this.graphQLSecurityGroup = new ec2.SecurityGroup(this, `${this.id}-security-group-${this.props.stage}`, {
        securityGroupName: `${this.id}-security-group-${this.props.stage}`,
        vpc: this.graphQLVpc,
      })

      this.graphQLSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic(), 'All Traffic')

      utils.createCfnOutput(`${this.id}-security-group-id`, this, this.graphQLSecurityGroup.securityGroupId)
    }
  }

  /**
   * Create ElastiCache
   * @protected
   */
  protected createElastiCache() {
    this.graphQLElastiCache = this.elasticacheManager.createReplicatedElastiCache(
      `${this.id}-elasticache`,
      this,
      this.props.graphQLElastiCache,
      this.graphQLVpc.privateSubnets.map(subnet => subnet.subnetId),
      [this.graphQLSecurityGroup.securityGroupId]
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
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create lambda function for GraphQL API
   * @protected
   */
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
