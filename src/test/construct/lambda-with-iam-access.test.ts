import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import { LambdaWithIamAccess, LambdaWithIamAccessProps } from '../../lib/construct'
import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'
import * as lambda from 'aws-cdk-lib/aws-lambda'

interface TestStackProps extends LambdaWithIamAccessProps {
  lambda: any
  lambdaSecret: SecretProps
  lambdaSource: any
}

const testStackProps = {
  name: 'test-lambda-with-iam-access-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stage: 'test',
  stackName: 'test',
  siteSubDomain: 'site',
  siteCreateAltARecord: true,
  extraContexts: ['src/test/common/cdkConfig/lambdas.json'],
  stageContextPath: 'src/test/common/cdkEnv',
  skipStageForARecords: true,
}

class TestCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestLambdaWithIamAccess(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      lambda: this.node.tryGetContext('testIamLambda'),
      lambdaSecret: {
        secretName: 'test-secret',
      },
      lambdaSource: new lambda.AssetCode('src/test/common/nodejs/lib'),
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
    template.resourceCountIs('AWS::IAM::Role', 2)
    template.resourceCountIs('AWS::IAM::Policy', 2)
    template.resourceCountIs('Custom::LogRetention', 1)
    template.resourceCountIs('AWS::Lambda::Function', 2)
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
      Code: {
        S3Bucket: {
          'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}',
        },
        S3Key: 'd5523e3b961cf2272cb4c94da89e310809981614bd36996014e2f23058109580.zip',
      },
      Role: {
        'Fn::GetAtt': ['testlambdawithiamaccessstacktestlambdawithiamlambdarole5E03F475', 'Arn'],
      },
      Architectures: ['arm64'],
      Environment: {
        Variables: {
          REGION: 'eu-west-1',
          STAGE: 'test',
          LAST_MODIFIED_TS: '',
        },
      },
      FunctionName: 'test-iam-lambda-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
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
      Name: 'test-secret',
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
