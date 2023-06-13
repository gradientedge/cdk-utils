import { CommonConstruct } from '../../common'
import { Construct } from 'constructs'
import { LambdaWithIamAccessEnvironment, LambdaWithIamAccessProps } from './types'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager'

/**
 * @category cdk-utils.lambda-with-iam-access
 * @subcategory construct
 * @classdesc Provides a construct to create a lambda function with IAM access
 *
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
 * @mixin
 */
export class LambdaWithIamAccess extends CommonConstruct {
  /* LambdaWithIamAccess props */
  props: LambdaWithIamAccessProps
  id: string

  /* LambdaWithIamAccess resources */
  lambdaPolicy: iam.PolicyDocument
  lambdaRole: iam.Role
  lambdaEnvironment: LambdaWithIamAccessEnvironment
  lambdaLayers: lambda.LayerVersion[]
  lambdaFunction: lambda.Function
  lambdaIamUser: iam.User
  lambdaUserAccessKey: iam.CfnAccessKey
  lambdaUserAccessSecret: secretsManager.Secret

  protected constructor(parent: Construct, id: string, props: LambdaWithIamAccessProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   * @protected
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
   * @protected
   */
  protected createLambdaPolicy() {
    this.lambdaPolicy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream()],
    })
  }

  /**
   * @summary Method to create iam role for Lambda function
   * @protected
   */
  protected createLambdaRole() {
    this.lambdaRole = this.iamManager.createRoleForLambda(`${this.id}-lambda-role`, this, this.lambdaPolicy)
  }

  /**
   * @summary Method to create environment variables for Lambda function
   * @protected
   */
  protected createLambdaEnvironment() {
    this.lambdaEnvironment = {
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create layers for Lambda function
   * @protected
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
   * @protected
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
      this.lambdaEnvironment
    )
  }

  /**
   * @summary Method to create iam user for the lambda function
   * @protected
   */
  protected createIamUserForLambdaFunction() {
    this.lambdaIamUser = new iam.User(this, `${this.id}-lambda-user`, {
      userName: `${this.id}-user-${this.props.stage}`,
    })

    new iam.Policy(this, `${this.id}-lambda-user-policy`, {
      policyName: `${this.id}-policy-${this.props.stage}`,
      statements: [
        new iam.PolicyStatement({
          resources: [this.lambdaFunction.functionArn],
          actions: ['lambda:InvokeFunction'],
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
   * @protected
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
