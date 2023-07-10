import * as _ from 'lodash'
import * as cdk from 'aws-cdk-lib'
import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as efs from 'aws-cdk-lib/aws-efs'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { SiteWithEcsBackendProps, SiteResponseHeadersPolicyProps } from './types'

/**
 * @classdesc Provides a construct to create and deploy a site hosted with an clustered ECS/ELB backend
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
  siteRegionalCertificate: certificateManager.ICertificate
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
  siteFileSystem: efs.FileSystem
  siteLogBucket: s3.IBucket
  siteOrigin: origins.HttpOrigin
  siteDistribution: cloudfront.Distribution
  siteInternalDomainName: string
  siteExternalDomainName: string
  siteDomainNames: string[]
  siteCloudfrontFunction: cloudfront.Function
  siteFunctionAssociations: cloudfront.FunctionAssociation[]
  siteOriginRequestPolicy: cloudfront.OriginRequestPolicy
  siteOriginResponseHeadersPolicy?: cloudfront.ResponseHeadersPolicy

  constructor(parent: Construct, id: string, props: SiteWithEcsBackendProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  protected initResources() {
    this.resolveHostedZone()
    this.resolveCertificate()
    this.resolveSiteSecrets()
    this.resolveSiteDomainNames()
    this.createSiteLogBucket()
    this.createVpc()
    this.createEcsPolicy()
    this.createEcsRole()
    this.createEcsEnvironment()
    this.createEcsCluster()
    this.createEcsLogGroup()
    this.createEcsBuildArgs()
    this.createEcsContainerImage()
    this.createEcsService()
    this.createSiteOriginRequestPolicy()
    this.createSiteOriginResponseHeadersPolicy()
    this.createSiteOrigin()
    this.createSiteCloudfrontFunction()
    this.resolveSiteFunctionAssociations()
    this.createDistribution()
    this.createNetworkMappings()
    this.invalidateDistributionCache()
  }

  /**
   * @summary Method to resolve a hosted zone based on domain attributes
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
   */
  protected resolveCertificate() {
    this.resolveGlobalCertificate()
    this.resolveRegionalCertificate()
  }

  protected resolveGlobalCertificate() {
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

  protected resolveRegionalCertificate() {
    if (
      this.props.siteRegionalCertificate.useExistingCertificate &&
      this.props.siteRegionalCertificate.certificateSsmName &&
      this.props.siteRegionalCertificate.certificateRegion
    ) {
      this.props.siteRegionalCertificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-regional-certificate-parameter`,
        this,
        this.props.siteRegionalCertificate.certificateSsmName,
        this.props.siteRegionalCertificate.certificateRegion
      )
    }
    this.siteRegionalCertificate = this.acmManager.resolveCertificate(
      `${this.id}-regional-certificate`,
      this,
      this.props.siteRegionalCertificate,
      this.siteHostedZone
    )
  }

  /**
   * @summary Method to resolve secrets from SecretsManager
   * - To be implemented in the overriding method in the implementation class
   */
  protected resolveSiteSecrets() {}

  /**
   * @summary Method to resolve site domain names
   */
  protected resolveSiteDomainNames() {
    /* the internal domain name used by ELB */
    this.siteInternalDomainName =
      this.isProductionStage() || this.props.skipStageForARecords
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
   */
  protected createVpc() {
    if (this.props.useExistingVpc) {
      this.siteVpc = this.vpcManager.retrieveCommonVpc(`${this.id}`, this, this.props.siteVpc.vpcName)
    } else {
      this.siteVpc = this.vpcManager.createCommonVpc(this, this.props.siteVpc, this.props.siteVpc.vpcName)
    }
  }

  /**
   * @summary Method to create iam policy for ECS Task
   */
  protected createEcsPolicy() {
    this.siteEcsPolicy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream()],
    })
  }

  /**
   * @summary Method to create iam role for ECS Task
   */
  protected createEcsRole() {
    this.siteEcsRole = this.iamManager.createRoleForEcsExecution(`${this.id}-ecs-role`, this, this.siteEcsPolicy)
  }

  /**
   * @summary Method to create environment variables used by ECS task
   */
  protected createEcsEnvironment() {
    this.siteEcsEnvironment = {
      LOG_LEVEL: this.props.logLevel,
      NODE_ENV: this.props.nodeEnv,
      TZ: this.props.timezone,
    }
  }

  /**
   * Method to create an ECS cluster
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
   */
  protected createEcsLogGroup() {
    this.siteEcsLogGroup = this.logManager.createLogGroup(`${this.id}-ecs-log-group`, this, this.props.siteLog)
  }

  /**
   * Method to create docker build arguments for ECS Image step
   */
  protected createEcsBuildArgs() {
    this.siteEcsBuildArgs = {}
  }

  /**
   * Method to create container image for ECS task
   */
  protected createEcsContainerImage() {
    this.siteEcsContainerImage = ecs.ContainerImage.fromAsset(this.props.siteEcsContainerImagePath, {
      buildArgs: this.siteEcsBuildArgs,
    })
  }

  /**
   * Method to create Application Loadbalanced ECS Fargate Service
   */
  protected createEcsService() {
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${this.id}-ecs-service`, {
      assignPublicIp: true,
      certificate: this.siteRegionalCertificate,
      cluster: this.siteEcsCluster,
      cpu: this.props.siteTask.cpu,
      desiredCount: this.props.siteTask.desiredCount,
      domainName: this.siteInternalDomainName,
      domainZone: this.siteHostedZone,
      enableECSManagedTags: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      listenerPort: this.props.siteTask.listenerPort,
      loadBalancerName: this.props.siteTask.loadBalancerName
        ? `${this.props.siteTask.loadBalancerName}-${this.props.stage}`
        : `${this.id}-${this.props.stage}`,
      maxHealthyPercent: this.props.siteTask.maxHealthyPercent,
      memoryLimitMiB: this.props.siteTask.memoryLimitMiB,
      minHealthyPercent: this.props.siteTask.minHealthyPercent,
      serviceName: `${this.id}-${this.props.stage}`,
      taskDefinition: this.props.siteTask.taskDefinition,
      taskImageOptions: {
        containerPort: this.props.siteTask.taskImageOptions?.containerPort,
        enableLogging: true,
        environment: this.siteEcsEnvironment,
        executionRole: this.siteEcsRole,
        image: this.siteEcsContainerImage,
        logDriver: ecs.LogDriver.awsLogs({
          logGroup: this.siteEcsLogGroup,
          logRetention: this.props.siteTask.logging?.logRetention,
          multilinePattern: this.props.siteTask.logging?.multilinePattern,
          streamPrefix: `${this.id}-${this.props.stage}/ecs`,
        }),
        secrets: this.siteSecrets,
        taskRole: this.siteEcsRole,
      },
    })

    if (this.props.siteHealthCheck) {
      fargateService.targetGroup.configureHealthCheck({
        enabled: this.props.siteHealthCheck.enabled ?? true,
        healthyGrpcCodes: this.props.siteHealthCheck.healthyGrpcCodes,
        healthyHttpCodes: this.props.siteHealthCheck.healthyHttpCodes,
        healthyThresholdCount: this.props.siteHealthCheck.healthyThresholdCount,
        interval: cdk.Duration.seconds(this.props.siteHealthCheck.intervalInSecs),
        path: this.props.siteHealthCheck.path ?? '/',
        port: this.props.siteHealthCheck.port,
        protocol: this.props.siteHealthCheck.protocol,
        timeout: cdk.Duration.seconds(this.props.siteHealthCheck.timeoutInSecs),
        unhealthyThresholdCount: this.props.siteHealthCheck.unhealthyThresholdCount,
      })
    }

    this.siteEcsService = fargateService.service
    this.siteEcsTaskDefinition = fargateService.taskDefinition
    this.siteEcsListener = fargateService.listener
    this.siteEcsLoadBalancer = fargateService.loadBalancer
    this.siteEcsTargetGroup = fargateService.targetGroup

    fargateService.loadBalancer.logAccessLogs(this.siteLogBucket, 'alb')

    if (this.props.siteTask.siteScaling) {
      const scalableTaskCount = this.siteEcsService.autoScaleTaskCount({
        maxCapacity: this.props.siteTask.siteScaling.maxCapacity ?? 4,
        minCapacity: this.props.siteTask.siteScaling.minCapacity,
      })

      if (this.props.siteTask.siteScaling.scaleOnCpuUtilization) {
        scalableTaskCount.scaleOnCpuUtilization(`${this.id}-cpu-scaling`, {
          targetUtilizationPercent: this.props.siteTask.siteScaling.scaleOnCpuUtilization ?? 50,
        })
      }

      if (this.props.siteTask.siteScaling.scaleOnMemoryUtilization) {
        scalableTaskCount.scaleOnMemoryUtilization(`${this.id}-mem-scaling`, {
          targetUtilizationPercent: this.props.siteTask.siteScaling.scaleOnMemoryUtilization ?? 50,
        })
      }

      if (this.props.siteTask.siteScaling.scaleOnRequestsPerTarget) {
        scalableTaskCount.scaleOnRequestCount(`${this.id}-req-count`, {
          requestsPerTarget: this.props.siteTask.siteScaling.scaleOnRequestsPerTarget ?? 10000,
          targetGroup: this.siteEcsTargetGroup,
        })
      }

      if (this.props.siteTask.siteScaling.scaleOnSchedule) {
        scalableTaskCount.scaleOnSchedule(`${this.id}-schedule`, this.props.siteTask.siteScaling.scaleOnSchedule)
      }
    }

    /* if enabled, add efs with access point and mount */
    if (this.props.siteFileSystem) {
      this.siteFileSystem = this.efsManager.createFileSystem(
        `${this.id}-fs`,
        this,
        this.props.siteFileSystem,
        this.siteVpc,
        this.props.siteFileSystemAccessPoints
      )

      /* allow access to/from EFS from Fargate ECS service */
      this.siteFileSystem.connections.allowDefaultPortFrom(this.siteEcsService.connections)
      this.siteFileSystem.connections.allowDefaultPortTo(this.siteEcsService.connections)

      /* add EFS permissions to ECS Role */
      this.siteEcsRole.addToPolicy(
        new iam.PolicyStatement(this.iamManager.statementForWriteEfs([this.siteFileSystem.fileSystemArn]))
      )

      /* add the efs volume to ecs task definition */
      this.siteEcsTaskDefinition.addVolume({
        efsVolumeConfiguration: {
          authorizationConfig: this.props.siteFileSystem.authorizationConfig,
          fileSystemId: this.siteFileSystem.fileSystemId,
          rootDirectory: this.props.siteFileSystem.rootDirectory,
          transitEncryption: this.props.siteFileSystem.transitEncryption,
          transitEncryptionPort: this.props.siteFileSystem.transitEncryptionPort,
        },
        name: `${this.id}-fs`,
      })

      if (this.props.siteTask.mountPoints && this.props.siteTask.mountPoints.length > 0) {
        this.props.siteTask.mountPoints.forEach(
          mountPoint =>
            this.siteEcsTaskDefinition.defaultContainer?.addMountPoints({
              containerPath: mountPoint.containerPath,
              readOnly: mountPoint.readOnly,
              sourceVolume: `${this.id}-fs`,
            })
        )
      }
    }

    this.addCfnOutput(`${this.id}-loadBalancerArn`, this.siteEcsLoadBalancer.loadBalancerArn ?? '')
    this.addCfnOutput(`${this.id}-loadBalancerName`, this.siteEcsLoadBalancer.loadBalancerName ?? '')
    this.addCfnOutput(`${this.id}-loadBalancerFullName`, this.siteEcsLoadBalancer.loadBalancerFullName ?? '')
    this.addCfnOutput(`${this.id}-loadBalancerDnsName`, this.siteEcsLoadBalancer.loadBalancerDnsName ?? '')
  }

  /**
   * Method to create log bucket for site distribution
   */
  protected createSiteLogBucket() {
    this.siteLogBucket = this.s3Manager.createS3Bucket(`${this.id}-site-logs`, this, this.props.siteLogBucket)
  }

  protected createSiteOriginRequestPolicy() {
    if (!this.props.siteOriginRequestPolicy) return
    this.siteOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, `${this.id}-sorp`, {
      comment: `Request Policy for ${this.id}-distribution - ${this.props.stage} stage`,
      cookieBehavior: this.props.siteOriginRequestPolicy.cookieBehavior,
      headerBehavior: this.props.siteOriginRequestPolicy.headerBehavior,
      originRequestPolicyName: `${this.id}-origin-request`,
      queryStringBehavior: this.props.siteOriginRequestPolicy.queryStringBehavior,
    })

    _.assign(this.props.siteDistribution.defaultBehavior, {
      originRequestPolicy: this.siteOriginRequestPolicy,
    })
  }

  protected createResponseHeaderPolicy(props: SiteResponseHeadersPolicyProps) {
    if (!props) return undefined
    return new cloudfront.ResponseHeadersPolicy(this, `${this.id}-${props.type}-srhp`, {
      ...props,
      comment: `Response Header Policy for ${props.type} for ${this.id}-distribution - ${this.props.stage} stage`,
      responseHeadersPolicyName: `${this.id}-${props.type}-response`,
      securityHeadersBehavior: {
        strictTransportSecurity: {
          ...props.securityHeadersBehavior?.strictTransportSecurity,
          accessControlMaxAge: cdk.Duration.seconds(
            props.securityHeadersBehavior?.strictTransportSecurity?.accessControlMaxAgeInSeconds
          ),
        },
      },
    })
  }

  protected createSiteOriginResponseHeadersPolicy() {
    if (!this.props.siteOriginResponseHeadersPolicy) return
    this.siteOriginResponseHeadersPolicy = this.createResponseHeaderPolicy(this.props.siteOriginResponseHeadersPolicy)
    _.assign(this.props.siteDistribution.defaultBehavior, {
      responseHeadersPolicy: this.siteOriginResponseHeadersPolicy,
    })
  }

  protected createSiteOrigin() {
    this.siteOrigin = new origins.HttpOrigin(this.siteInternalDomainName, {
      httpPort: this.props.siteTask.listenerPort,
      originId: `${this.id}-server`,
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    })
  }

  /**
   * @summary Method to create a site cloudfront function
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
   */
  protected resolveSiteFunctionAssociations() {
    if (this.props.siteCloudfrontFunctionProps) {
      this.siteFunctionAssociations = [
        {
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          function: this.siteCloudfrontFunction,
        },
      ]
    }
  }

  /**
   * Method to create Site distribution
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
      this.siteFunctionAssociations,
      this.props.siteDistribution.defaultBehavior.responseHeadersPolicy
    )
  }

  /**
   * Method to create Route53 records for distribution
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
