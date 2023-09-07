import { Fn } from 'aws-cdk-lib'
import { ISecurityGroup, IVpc, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import { CfnReplicationGroup } from 'aws-cdk-lib/aws-elasticache'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import _ from 'lodash'
import { GraphQLApiLambda } from '..'
import * as utils from '../../utils'
import { GraphQlApiLambdaWithCacheProps } from './types'

/**
 * @deprecated Use RestApiLambdaWithCache instead. This will be removed in a future release.
 * @classdesc Provides a construct to create and deploy a Graphql API as Lambda with Caching
 *
 * <b>Architecture</b><br/> ![Architecture](./GraphQLApiLambda.jpg)
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
  graphQLVpc: IVpc
  graphQLElastiCache: CfnReplicationGroup
  graphQLSecurityGroup: ISecurityGroup
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
   */
  protected setSecurityGroup() {
    if (this.props.securityGroupExportName) {
      this.graphQLSecurityGroup = SecurityGroup.fromSecurityGroupId(
        this,
        `${this.id}`,
        Fn.importValue(this.props.securityGroupExportName)
      )
    } else {
      this.graphQLSecurityGroup = new SecurityGroup(this, `${this.id}-security-group-${this.props.stage}`, {
        securityGroupName: `${this.id}-security-group-${this.props.stage}`,
        vpc: this.graphQLVpc,
      })

      this.graphQLSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.allTraffic(), 'All Traffic')

      utils.createCfnOutput(`${this.id}-security-group-id`, this, this.graphQLSecurityGroup.securityGroupId)
    }
  }

  /**
   * Create ElastiCache
   */
  protected createElastiCache() {
    this.graphQLElastiCache = this.elasticacheManager.createReplicatedElastiCache(
      `${this.id}-elasticache`,
      this,
      this.props.graphQLElastiCache,
      _.map(this.graphQLVpc.privateSubnets, subnet => subnet.subnetId),
      [this.graphQLSecurityGroup.securityGroupId]
    )
  }

  /**
   * Create Lambda Role
   */
  protected createLambdaRole() {
    super.createLambdaRole()

    this.graphQLApiLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
    )
  }

  /**
   * @summary Method to create environment variables for GraphQL Lambda function
   */
  protected createLambdaEnvironment() {
    this.graphQLApiLambdaEnvironment = {
      LOG_LEVEL: this.props.logLevel,
      NODE_ENV: this.props.nodeEnv,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create lambda function for GraphQL API
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
