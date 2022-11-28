import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { SiteWithEcsBackendProps } from '../../types'

/**
 * @stability stable
 * @category cdk-utils.site-with-ecs-backend
 * @subcategory construct
 * @classdesc Provides a construct to create and deploy a site hosted with an clustered ECS/ELB backend
 *
 * @example
 * import { SiteWithEcsBackend, SiteWithEcsBackendProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends SiteWithEcsBackend {
 *   constructor(parent: Construct, id: string, props: SiteWithEcsBackendProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class SiteWithEcsBackend extends CommonConstruct {
  /* site properties */
  props: SiteWithEcsBackendProps
  id: string

  /* site resources */
  siteHostedZone: route53.IHostedZone
  siteCertificate: certificateManager.ICertificate
  siteEcsPolicy: iam.PolicyDocument
  siteEcsRole: iam.Role
  siteEcsEnvironment: { [key: string]: string }
  siteVpc: ec2.IVpc
  siteSecrets: any
  siteEcsCluster: ecs.Cluster
  siteEcsLogGroup: logs.LogGroup
  siteEcsBuildArgs: any = {}
  siteEcsContainerImage: ecs.AssetImage
  siteEcsService: ecs.FargateService
  siteEcsTaskDefinition: ecs.FargateTaskDefinition
  siteEcsListener: elb.ApplicationListener
  siteEcsLoadBalancer: elb.ApplicationLoadBalancer
  siteEcsTargetGroup: elb.ApplicationTargetGroup
  siteLogBucket: s3.IBucket
  siteOrigin: origins.HttpOrigin
  siteDistribution: cloudfront.Distribution
  siteInternalDomainName: string
  siteExternalDomainName: string
  siteDomainNames: string[]
  siteCloudfrontFunction: cloudfront.Function
  siteFunctionAssociations: cloudfront.FunctionAssociation[]

  constructor(parent: Construct, id: string, props: SiteWithEcsBackendProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   * @protected
   */
  protected initResources() {
    this.resolveHostedZone()
    this.resolveCertificate()
    this.resolveSiteSecrets()
    this.resolveSiteDomainNames()
    this.createVpc()
    this.createEcsPolicy()
    this.createEcsRole()
    this.createEcsEnvironment()
    this.createEcsCluster()
    this.createEcsLogGroup()
    this.createEcsBuildArgs()
    this.createEcsContainerImage()
    this.createEcsService()
    this.createSiteLogBucket()
    this.createSiteOrigin()
    this.createSiteCloudfrontFunction()
    this.resolveSiteFunctionAssociations()
    this.createDistribution()
    this.createNetworkMappings()
    this.invalidateDistributionCache()
  }

  /**
   * @summary Method to resolve a hosted zone based on domain attributes
   * @protected
   */
  protected resolveHostedZone() {
    this.siteHostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
      `${this.id}-hosted-zone`,
      this,
      this.props.useExistingHostedZone
    )
  }

  /**
   * @summary Method to resolve a certificate based on attributes
   * @protected
   */
  protected resolveCertificate() {
    /* determine site certificate */
    if (
      this.props.siteCertificate.useExistingCertificate &&
      this.props.siteCertificate.certificateSsmName &&
      this.props.siteCertificate.certificateRegion
    ) {
      this.props.siteCertificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-certificate-parameter`,
        this,
        this.props.siteCertificate.certificateSsmName,
        this.props.siteCertificate.certificateRegion
      )
    }
    this.siteCertificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.siteCertificate
    )
  }

  /**
   * @summary Method to resolve secrets from SecretsManager
   * - To be implemented in the overriding method in the implementation class
   * @protected
   */
  protected resolveSiteSecrets() {}

  /**
   * @summary Method to resolve site domain names
   * @protected
   */
  protected resolveSiteDomainNames() {
    /* the internal domain name used by ELB */
    this.siteInternalDomainName = this.isProductionStage()
      ? `${this.props.siteSubDomain}-internal.${this.fullyQualifiedDomainName}`
      : `${this.props.siteSubDomain}-internal-${this.props.stage}.${this.fullyQualifiedDomainName}`

    /* the external domain name exposed to CloudFront */
    this.siteExternalDomainName =
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.siteSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.siteSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`

    this.siteDomainNames = [this.siteExternalDomainName]
  }

  /**
   * Create VPC
   * @protected
   */
  protected createVpc() {
    this.siteVpc = this.vpcManager.createCommonVpc(this, this.props.siteVpc, this.props.siteVpc.vpcName)
  }

  /**
   * @summary Method to create iam policy for ECS Task
   * @protected
   */
  protected createEcsPolicy() {
    this.siteEcsPolicy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream()],
    })
  }

  /**
   * @summary Method to create iam role for ECS Task
   * @protected
   */
  protected createEcsRole() {
    this.siteEcsRole = this.iamManager.createRoleForEcsExecution(`${this.id}-ecs-role`, this, this.siteEcsPolicy)
  }

  /**
   * @summary Method to create environment variables used by ECS task
   * @protected
   */
  protected createEcsEnvironment() {
    this.siteEcsEnvironment = {
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
    }
  }

  /**
   * Method to create an ECS cluster
   * @protected
   */
  protected createEcsCluster() {
    this.siteEcsCluster = this.ecsManager.createEcsCluster(
      `${this.id}-cluster`,
      this,
      this.props.siteCluster,
      this.siteVpc
    )
  }

  /**
   * Method to create log group used by ECS task
   * @protected
   */
  protected createEcsLogGroup() {
    this.siteEcsLogGroup = this.logManager.createLogGroup(`${this.id}-ecs-log-group`, this, this.props.siteLog)
  }

  /**
   * Method to create docker build arguments for ECS Image step
   * @protected
   */
  protected createEcsBuildArgs() {
    this.siteEcsBuildArgs = {}
  }

  /**
   * Method to create container image for ECS task
   * @protected
   */
  protected createEcsContainerImage() {
    this.siteEcsContainerImage = ecs.ContainerImage.fromAsset(this.props.siteEcsContainerImagePath, {
      buildArgs: this.siteEcsBuildArgs,
    })
  }

  /**
   * Method to create Application Loadbalanced ECS Fargate Service
   * @protected
   */
  protected createEcsService() {
    const fargateService = this.ecsManager.createLoadBalancedFargateService(
      this.id,
      this,
      {
        ...this.props.siteTask,
        ...{
          domainName: this.siteInternalDomainName,
          domainZone: this.siteHostedZone,
          healthCheck: this.props.siteHealthCheck,
          taskImageOptions: {
            ...this.props.siteTask.taskImageOptions,
            environment: this.siteEcsEnvironment,
            executionRole: this.siteEcsRole,
            taskRole: this.siteEcsRole,
            image: this.siteEcsContainerImage,
            secrets: this.siteSecrets,
          },
        },
      },
      this.siteEcsCluster,
      this.siteEcsLogGroup
    )

    this.siteEcsService = fargateService.service
    this.siteEcsTaskDefinition = fargateService.taskDefinition
    this.siteEcsListener = fargateService.listener
    this.siteEcsLoadBalancer = fargateService.loadBalancer
    this.siteEcsTargetGroup = fargateService.targetGroup
  }

  /**
   * Method to create log bucket for site distribution
   * @protected
   */
  protected createSiteLogBucket() {
    this.siteLogBucket = this.s3Manager.createS3Bucket(`${this.id}-site-logs`, this, this.props.siteLogBucket)
  }

  protected createSiteOrigin() {
    this.siteOrigin = new origins.HttpOrigin(this.siteEcsLoadBalancer.loadBalancerDnsName, {
      httpPort: this.props.siteTask.listenerPort,
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    })
  }

  /**
   * @summary Method to create a site cloudfront function
   * @protected
   */
  protected createSiteCloudfrontFunction() {
    if (this.props.siteCloudfrontFunctionProps) {
      this.siteCloudfrontFunction = this.cloudFrontManager.createCloudfrontFunction(
        `${this.id}-function`,
        this,
        this.props.siteCloudfrontFunctionProps
      )
    }
  }

  /**
   * @summary Method to create a site cloudfront function associations
   * @protected
   */
  protected resolveSiteFunctionAssociations() {
    if (this.props.siteCloudfrontFunctionProps) {
      this.siteFunctionAssociations = [
        {
          function: this.siteCloudfrontFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        },
      ]
    }
  }

  /**
   * Method to create Site distribution
   * @protected
   */
  protected createDistribution() {
    this.siteDistribution = this.cloudFrontManager.createDistributionWithHttpOrigin(
      `${this.id}-distribution`,
      this,
      this.props.siteDistribution,
      this.siteOrigin,
      this.siteDomainNames,
      this.siteLogBucket,
      this.siteCertificate,
      this.siteFunctionAssociations
    )
  }

  /**
   * Method to create Route53 records for distribution
   * @protected
   */
  protected createNetworkMappings() {
    this.route53Manager.createCloudFrontTargetARecord(
      `${this.id}-a-record`,
      this,
      this.siteDistribution,
      this.siteHostedZone,
      this.props.siteRecordName,
      this.props.skipStageForARecords
    )
  }

  /**
   * Method to invalidation the cloudfront distribution cache after a deployment
   * @protected
   */
  protected invalidateDistributionCache() {
    if (this.props.siteCacheInvalidationDockerFilePath) {
      this.cloudFrontManager.invalidateCache(
        `${this.id}-cache-invalidation`,
        this,
        this.props.siteCacheInvalidationDockerFilePath,
        this.siteDistribution.distributionId
      )
    }
  }
}
