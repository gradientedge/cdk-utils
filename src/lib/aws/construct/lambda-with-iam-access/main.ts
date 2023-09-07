import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2'
import { IAccessPoint } from 'aws-cdk-lib/aws-efs'
import { CfnAccessKey, Policy, PolicyDocument, PolicyStatement, Role, User } from 'aws-cdk-lib/aws-iam'
import { AssetCode, IFunction, ILayerVersion, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { CfnSecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { LambdaWithIamAccessEnvironment, LambdaWithIamAccessProps } from './types'

/**
 * @classdesc Provides a construct to create a lambda function with IAM access
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
 */
export class LambdaWithIamAccess extends CommonConstruct {
  /* LambdaWithIamAccess props */
  props: LambdaWithIamAccessProps
  id: string

  /* LambdaWithIamAccess resources */
  lambdaPolicy: PolicyDocument
  lambdaRole: Role
  lambdaEnvironment: LambdaWithIamAccessEnvironment
  lambdaLayers: ILayerVersion[]
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

  protected resolveVpc() {}

  protected resolveSecurityGroups() {}

  protected resolveAccessPoint() {}

  protected resolveMountPath() {}

  protected resolveVpcSubnets() {}

  /**
   * @summary Method to create iam policy for Lambda function
   */
  protected createLambdaPolicy() {
    this.lambdaPolicy = new PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream()],
    })
  }

  /**
   * @summary Method to create iam role for Lambda function
   */
  protected createLambdaRole() {
    this.lambdaRole = this.iamManager.createRoleForLambda(`${this.id}-lambda-role`, this, this.lambdaPolicy)
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

    if (!this.props.lambdaLayerSources) return

    _.forEach(this.props.lambdaLayerSources, (source: AssetCode, index: number) => {
      layers.push(this.lambdaManager.createLambdaLayer(`${this.id}-layer-${index}`, this, source))
    })

    this.lambdaLayers = layers
  }

  /**
   * @summary Method to create lambda function
   */
  protected createLambdaFunction() {
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
      userName: `${this.id}-user-${this.props.stage}`,
    })

    new Policy(this, `${this.id}-lambda-user-policy`, {
      policyName: `${this.id}-policy-${this.props.stage}`,
      statements: [
        new PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [this.lambdaFunction.functionArn],
        }),
      ],
      users: [this.lambdaIamUser],
    })

    this.lambdaUserAccessKey = new CfnAccessKey(this, `${this.id}-access-key-${this.props.stage}`, {
      userName: this.lambdaIamUser.userName,
    })
  }

  /**
   * @summary Method to create iam secret for the lambda function
   */
  protected createIamSecretForLambdaFunction() {
    this.lambdaUserAccessSecret = new Secret(
      this,
      `${this.id}-lambda-user-secret-${this.props.stage}`,
      this.props.lambdaSecret
    )

    const cfnSecret = this.lambdaUserAccessSecret.node.defaultChild as CfnSecret
    cfnSecret.generateSecretString = undefined
    cfnSecret.secretString = `{ "ACCESS_KEY_ID": "${this.lambdaUserAccessKey.ref}", "ACCESS_KEY_SECRET": "${this.lambdaUserAccessKey.attrSecretAccessKey}" }`
  }
}
