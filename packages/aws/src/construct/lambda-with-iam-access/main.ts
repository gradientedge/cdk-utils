import { Fn } from 'aws-cdk-lib'
import { ISecurityGroup, IVpc, SecurityGroup, SubnetSelection } from 'aws-cdk-lib/aws-ec2'
import { IAccessPoint } from 'aws-cdk-lib/aws-efs'
import { CfnAccessKey, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, User } from 'aws-cdk-lib/aws-iam'
import { AssetCode, IFunction, ILayerVersion, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { CfnSecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import _ from 'lodash'

import { CommonConstruct } from '../../common/index.js'
import { Architecture } from '../../services/index.js'

import { LambdaWithIamAccessEnvironment, LambdaWithIamAccessProps } from './types.js'

/**
 * Provides a construct to create a lambda function with IAM access
 * @example
 * import { LambdaWithIamAccess, LambdaWithIamAccessProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends LambdaWithIamAccess {
 *   constructor(parent: Construct, id: string, props: LambdaWithIamAccessProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class LambdaWithIamAccess extends CommonConstruct {
  /* LambdaWithIamAccess props */
  props: LambdaWithIamAccessProps
  id: string

  /* LambdaWithIamAccess resources */
  lambdaPolicy: PolicyDocument
  lambdaRole: Role
  lambdaEnvironment: LambdaWithIamAccessEnvironment
  lambdaLayers: ILayerVersion[] = []
  lambdaFunction: IFunction
  lambdaIamUser: User
  lambdaUserAccessKey: CfnAccessKey
  lambdaUserAccessSecret: Secret
  lambdaVpc: IVpc
  lambdaSecurityGroups: ISecurityGroup[]
  lambdaAccessPoint: IAccessPoint
  lambdaMountPath: string
  lambdaVpcSubnets: SubnetSelection

  constructor(parent: Construct, id: string, props: LambdaWithIamAccessProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.resolveVpc()
    this.resolveSecurityGroups()
    this.resolveAccessPoint()
    this.resolveMountPath()
    this.resolveVpcSubnets()
    this.createLambdaPolicy()
    this.createLambdaRole()
    this.createLambdaEnvironment()
    this.createLambdaLayers()
    this.createLambdaFunction()
    this.createIamUserForLambdaFunction()
    this.createIamSecretForLambdaFunction()
  }

  /**
   * @summary Resolve the VPC for the Lambda function if a VPC name is provided
   */
  protected resolveVpc() {
    if (this.props.vpcName) {
      this.lambdaVpc = this.vpcManager.retrieveCommonVpc(`${this.id}-vpc`, this, this.props.vpcName)
    }
  }

  /**
   * @summary Resolve the security groups for the Lambda function from an exported value
   */
  protected resolveSecurityGroups() {
    if (this.props.securityGroupExportName) {
      const lambdaSecurityGroup = SecurityGroup.fromSecurityGroupId(
        this,
        `${this.id}-security-group`,
        Fn.importValue(this.props.securityGroupExportName)
      )
      this.addCfnOutput(`${this.id}-sg`, lambdaSecurityGroup.securityGroupId)
      this.lambdaSecurityGroups = [lambdaSecurityGroup]
    }
  }

  /**
   * @summary Resolve the EFS access point for the Lambda function. Override to provide an access point.
   */
  protected resolveAccessPoint() {}

  /**
   * @summary Resolve the EFS mount path for the Lambda function. Override to provide a mount path.
   */
  protected resolveMountPath() {}

  /**
   * @summary Resolve the VPC subnets for the Lambda function. Override to provide specific subnets.
   */
  protected resolveVpcSubnets() {}

  /**
   * @summary Method to create iam policy for Lambda function
   */
  protected createLambdaPolicy() {
    this.lambdaPolicy = new PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream(), this.iamManager.statementForPutXrayTelemetry()],
    })
    if (this.props.configEnabled) {
      this.lambdaPolicy.addStatements(
        this.iamManager.statementForReadAnyAppConfig(),
        this.iamManager.statementForAppConfigExecution()
      )
    }
  }

  /**
   * @summary Method to create iam role for Lambda function
   */
  protected createLambdaRole() {
    this.lambdaRole = this.iamManager.createRoleForLambda(`${this.id}-lambda-role`, this, this.lambdaPolicy)
    if (this.props.vpcName) {
      this.lambdaRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
      )
    }
  }

  /**
   * @summary Method to create environment variables for Lambda function
   */
  protected createLambdaEnvironment() {
    this.lambdaEnvironment = {
      LOG_LEVEL: this.props.logLevel,
      NODE_ENV: this.props.nodeEnv,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create layers for Lambda function
   */
  protected createLambdaLayers() {
    const layers: LayerVersion[] = []

    if (this.props.lambdaLayerSources) {
      _.forEach(this.props.lambdaLayerSources, (source: AssetCode, index: number) => {
        layers.push(this.lambdaManager.createLambdaLayer(`${this.id}-layer-${index}`, this, source))
      })
      this.lambdaLayers = layers
    }

    if (this.props.configEnabled) {
      const appConfigExtensionLayer = LayerVersion.fromLayerVersionArn(
        this,
        `${this.id}-ac-extlayer`,
        this.appConfigManager.getArnForAppConfigExtension(this, Architecture.ARM_64)
      )
      this.lambdaLayers.push(appConfigExtensionLayer)
    }
  }

  /**
   * @summary Method to create lambda function
   */
  protected createLambdaFunction() {
    if (this.props.lambdaInsightsVersion) {
      _.assign(this.props.lambda, {
        insightsVersion: this.props.lambdaInsightsVersion,
      })
    }

    this.lambdaFunction = this.lambdaManager.createLambdaFunction(
      `${this.id}-lambda`,
      this,
      this.props.lambda,
      this.lambdaRole,
      this.lambdaLayers,
      this.props.lambdaSource,
      this.props.lambdaHandler || 'index.handler',
      this.lambdaEnvironment,
      this.lambdaVpc,
      this.lambdaSecurityGroups,
      this.lambdaAccessPoint,
      this.lambdaMountPath,
      this.lambdaVpcSubnets
    )
  }

  /**
   * @summary Method to create iam user for the lambda function
   */
  protected createIamUserForLambdaFunction() {
    this.lambdaIamUser = new User(this, `${this.id}-lambda-user`, {
      userName: this.resourceNameFormatter.format(`${this.id}-user`),
    })

    /* The wildcard suffix on the ARN is needed to match alias-qualified ARNs
       (e.g. arn:...:function:name:aliasName) for InvokeFunction permission */
    new Policy(this, `${this.id}-lambda-user-policy`, {
      policyName: this.resourceNameFormatter.format(`${this.id}-policy`),
      statements: [
        new PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [this.lambdaFunction.functionArn, `${this.lambdaFunction.functionArn}*`],
        }),
      ],
      users: [this.lambdaIamUser],
    })

    if (this.props.lambda.lambdaAliases && !_.isEmpty(this.props.lambda.lambdaAliases)) {
      _.forEach(this.props.lambda.lambdaAliases, (alias, index) => {
        new Policy(this, `${this.id}-alias-user-policy`, {
          policyName: this.resourceNameFormatter.format(`${this.id}--alias-policy-${index}`),
          statements: [
            new PolicyStatement({
              actions: ['lambda:InvokeFunction'],
              resources: [
                `${this.lambdaFunction.functionArn}:${alias.aliasName}`,
                `${this.lambdaFunction.functionArn}:${alias.aliasName}*`,
              ],
            }),
          ],
          users: [this.lambdaIamUser],
        })
      })
    }

    /* Stage is included in the logical ID to avoid collisions when deploying
       multiple stages to the same AWS account */
    this.lambdaUserAccessKey = new CfnAccessKey(this, `${this.id}-access-key-${this.props.stage}`, {
      userName: this.lambdaIamUser.userName,
    })
  }

  /**
   * @summary Method to create iam secret for the lambda function
   */
  protected createIamSecretForLambdaFunction() {
    this.lambdaUserAccessSecret = this.secretsManager.createSecret(
      `${this.id}-lambda-user-secret-${this.props.stage}`,
      this,
      this.props.lambdaSecret
    )

    /* Override the L1 CfnSecret to disable auto-generated secret string and inject
       the IAM access key credentials instead. We use a template literal (not JSON.stringify)
       because the values contain CloudFormation Ref/GetAtt tokens that must not be escaped. */
    const cfnSecret = this.lambdaUserAccessSecret.node.defaultChild as CfnSecret
    cfnSecret.generateSecretString = undefined
    cfnSecret.secretString = `{ "ACCESS_KEY_ID": "${this.lambdaUserAccessKey.ref}", "ACCESS_KEY_SECRET": "${this.lambdaUserAccessKey.attrSecretAccessKey}" }`
  }
}
