import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonStack, LambdaWithIamAccess, LambdaWithIamAccessProps } from '../../../lib/aws/index.js'

interface TestStackProps extends LambdaWithIamAccessProps {
  lambda: any
  lambdaSecret: SecretProps
  lambdaSource: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/aws/common/cdkConfig/lambdas.json'],
  name: 'test-lambda-with-iam-access-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  skipStageForARecords: true,
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestLambdaWithIamAccess(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      consigEnabled: true,
      lambda: this.node.tryGetContext('testIamLambda'),
      lambdaInsightsVersion: lambda.LambdaInsightsVersion.fromInsightVersionArn(
        `arn:aws:lambda:${this.node.tryGetContext('region')}:580247275435:layer:LambdaInsightsExtension-Arm64:2`
      ),
      lambdaSecret: {
        secretName: 'test-secret',
      },
      lambdaSource: new lambda.AssetCode('src/test/aws/common/nodejs/lib'),
    }
  }
}

class TestLambdaWithIamAccess extends LambdaWithIamAccess {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props
    this.id = 'test-lambda-with-iam'
    this.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-static-asset-deployment-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestLambdaWithIamAccess', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('lambda')
    expect(stack.props.lambda.functionName).toEqual('test-iam-lambda')
  })
})

describe('TestLambdaWithIamAccess', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 1)
    template.resourceCountIs('AWS::IAM::Policy', 1)
    template.resourceCountIs('Custom::LogRetention', 0)
    template.resourceCountIs('AWS::Lambda::Function', 1)
    template.resourceCountIs('AWS::SecretsManager::Secret', 1)
  })
})

describe('TestLambdaWithIamAccess', () => {
  test('outputs as expected', () => {
    template.hasOutput('testLambdaWithIamLambdaRoleArn', {})
    template.hasOutput('testLambdaWithIamLambdaRoleName', {})
    template.hasOutput('testLambdaWithIamLambdaLambdaArn', {})
    template.hasOutput('testLambdaWithIamLambdaLambdaName', {})
  })
})

describe('TestLambdaWithIamAccess', () => {
  test('provisions lambda function as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: ['arm64'],
      Code: {
        S3Bucket: {
          'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}',
        },
        S3Key: 'd5523e3b961cf2272cb4c94da89e310809981614bd36996014e2f23058109580.zip',
      },
      Environment: {
        Variables: {
          REGION: 'eu-west-1',
          STAGE: 'test',
        },
      },
      FunctionName: 'cdktest-test-iam-lambda-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Role: {
        'Fn::GetAtt': ['testlambdawithiamaccessstacktestlambdawithiamlambdarole5E03F475', 'Arn'],
      },
      Runtime: 'nodejs22.x',
      Tags: [
        {
          Key: 'testTagName1',
          Value: 'testTagValue1',
        },
        {
          Key: 'testTagName2',
          Value: 'testTagValue2',
        },
      ],
      Timeout: 60,
    })
  })
})

describe('TestLambdaWithIamAccess', () => {
  test('provisions secret as expected', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'cdktest-test-secret-test',
      SecretString: {
        'Fn::Join': [
          '',
          [
            '{ "ACCESS_KEY_ID": "',
            {
              Ref: 'testlambdawithiamaccessstacktestlambdawithiamaccesskeytest8AF81149',
            },
            '", "ACCESS_KEY_SECRET": "',
            {
              'Fn::GetAtt': ['testlambdawithiamaccessstacktestlambdawithiamaccesskeytest8AF81149', 'SecretAccessKey'],
            },
            '" }',
          ],
        ],
      },
    })
  })
})
