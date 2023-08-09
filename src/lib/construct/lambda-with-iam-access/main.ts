import { CommonConstruct } from '../../common'
import { Construct } from 'constructs'
import { LambdaWithIamAccessEnvironment, LambdaWithIamAccessProps } from './types'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

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
  lambdaPolicy: iam.PolicyDocument
  lambdaRole: iam.Role
  lambdaEnvironment: LambdaWithIamAccessEnvironment
  lambdaLayers: lambda.ILayerVersion[]
  lambdaFunction: lambda.Function
  lambdaIamUser: iam.User
  lambdaUserAccessKey: iam.CfnAccessKey
  lambdaUserAccessSecret: secretsManager.Secret
  lambdaVpc: ec2.IVpc
  lambdaSecurityGroup: ec2.ISecurityGroup

  constructor(parent: Construct, id: string, props: LambdaWithIamAccessProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createLambdaPolicy()
    this.createLambdaRole()
    this.createLambdaEnvironment()
    this.createLambdaLayers()
    this.createLambdaFunction()
    this.createIamUserForLambdaFunction()
    this.createIamSecretForLambdaFunction()
  }

  /**
   * @summary Method to create iam policy for Lambda function
   */
  protected createLambdaPolicy() {
    this.lambdaPolicy = new iam.PolicyDocument({
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
    const layers: lambda.LayerVersion[] = []

    if (!this.props.lambdaLayerSources) return

    this.props.lambdaLayerSources.forEach((source: lambda.AssetCode, index: number) => {
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
      [this.lambdaSecurityGroup],
      undefined,
      undefined,
      this.lambdaVpc
    )
  }

  /**
   * @summary Method to create iam user for the lambda function
   */
  protected createIamUserForLambdaFunction() {
    this.lambdaIamUser = new iam.User(this, `${this.id}-lambda-user`, {
      userName: `${this.id}-user-${this.props.stage}`,
    })

    new iam.Policy(this, `${this.id}-lambda-user-policy`, {
      policyName: `${this.id}-policy-${this.props.stage}`,
      statements: [
        new iam.PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [this.lambdaFunction.functionArn],
        }),
      ],
      users: [this.lambdaIamUser],
    })

    this.lambdaUserAccessKey = new iam.CfnAccessKey(this, `${this.id}-access-key-${this.props.stage}`, {
      userName: this.lambdaIamUser.userName,
    })
  }

  /**
   * @summary Method to create iam secret for the lambda function
   */
  protected createIamSecretForLambdaFunction() {
    this.lambdaUserAccessSecret = new secretsManager.Secret(
      this,
      `${this.id}-lambda-user-secret-${this.props.stage}`,
      this.props.lambdaSecret
    )

    const cfnSecret = this.lambdaUserAccessSecret.node.defaultChild as secretsManager.CfnSecret
    cfnSecret.generateSecretString = undefined
    cfnSecret.secretString = `{ "ACCESS_KEY_ID": "${this.lambdaUserAccessKey.ref}", "ACCESS_KEY_SECRET": "${this.lambdaUserAccessKey.attrSecretAccessKey}" }`
  }
}
