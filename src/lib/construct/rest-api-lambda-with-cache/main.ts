import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { RestApiLambda } from '..'
import { RestApiLambdaWithCacheProps } from './types'
import * as utils from '../../utils'

/**
 * @classdesc Provides a construct to create and deploy a RestApi API as Lambda with Caching
 *
 * <b>Architecture</b><br/> ![Architecture](./RestApiLambda.jpg)
 * @example
 * import { RestApiLambdaWithCacheProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends RestApiLambdaWithCache {
 *   constructor(parent: Construct, id: string, props: RestApiLambdaWithCacheProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export abstract class RestApiLambdaWithCache extends RestApiLambda {
  /* restApiLambdaWithCache props */
  props: RestApiLambdaWithCacheProps
  id: string

  /* restApiLambda resources */
  restApivpc: ec2.IVpc
  restApiCache: elasticache.CfnReplicationGroup
  restApiSecurityGroup: ec2.ISecurityGroup
  restApiSecurityGroupExportName: string

  protected constructor(parent: Construct, id: string, props: RestApiLambdaWithCacheProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  protected initResources() {
    this.resolveVpc()
    this.resolveSecurityGroup()
    this.createElastiCache()
    super.initResources()
  }

  /**
   * Create VPC
   */
  protected resolveVpc() {
    if (this.props.useExistingVpc) {
      this.restApivpc = this.vpcManager.retrieveCommonVpc(`${this.id}`, this, this.props.vpcName)
    } else {
      this.restApivpc = this.vpcManager.createCommonVpc(this, this.props.restApiVpc, this.props.restApiVpc.vpcName)
    }
  }

  /**
   * Resolve Security Group
   */
  protected resolveSecurityGroup() {
    if (!this.props.restApiCache) {
      return
    }

    if (this.props.securityGroupExportName) {
      this.restApiSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        `${this.id}`,
        cdk.Fn.importValue(this.props.securityGroupExportName)
      )
    } else {
      this.restApiSecurityGroup = new ec2.SecurityGroup(this, `${this.id}-security-group-${this.props.stage}`, {
        securityGroupName: `${this.id}-security-group-${this.props.stage}`,
        vpc: this.restApivpc,
      })

      this.restApiSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic(), 'All Traffic')

      utils.createCfnOutput(`${this.id}-security-group-id`, this, this.restApiSecurityGroup.securityGroupId)
    }
  }

  /**
   * Create ElastiCache
   */
  protected createElastiCache() {
    if (!this.props.restApiCache) {
      return
    }

    this.restApiCache = this.elasticacheManager.createReplicatedElastiCache(
      `${this.id}-elasticache`,
      this,
      this.props.restApiCache,
      this.restApivpc.privateSubnets.map(subnet => subnet.subnetId),
      [this.restApiSecurityGroup.securityGroupId]
    )

    this.ssmManager.writeStringToParameters(`${this.id}-elasticache-endpoint-address`, this, {
      description: `Elasticache address to use by applications`,
      parameterName: `${this.id}-elasticache-endpoint-address`,
      stringValue: this.restApiCache.attrConfigurationEndPointAddress,
    })

    this.ssmManager.writeStringToParameters(`${this.id}-elasticache-endpoint-port`, this, {
      description: `Elasticache port to use by applications`,
      parameterName: `${this.id}-elasticache-endpoint-port`,
      stringValue: this.restApiCache.attrConfigurationEndPointPort,
    })
  }

  /**
   * Create Lambda Role
   */
  protected createLambdaRole() {
    super.createLambdaRole()

    this.restApiLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
    )
  }

  /**
   * @summary Method to create environment variables for RestApi Lambda function
   */
  protected createLambdaEnvironment() {
    this.restApiLambdaEnvironment = {
      LOG_LEVEL: this.props.logLevel,
      NODE_ENV: this.props.nodeEnv,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create lambda function for RestApi API
   */
  protected createLambdaFunction() {
    this.restApiLambdaFunction = this.lambdaManager.createLambdaFunction(
      `${this.id}-restapi-server`,
      this,
      this.props.restApiLambda,
      this.restApiLambdaRole,
      this.restApiLambdaLayers,
      this.props.restApiSource,
      this.props.restApiHandler || 'index.handler',
      this.restApiLambdaEnvironment,
      this.restApivpc,
      [this.restApiSecurityGroup],
      undefined,
      undefined,
      this.restApivpc
    )
  }
}
