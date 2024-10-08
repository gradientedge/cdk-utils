import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testAnotherService: any
  testLambda: any
  testService: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/lambdas.json', 'src/test/aws/common/cdkConfig/services.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testAnotherService: this.node.tryGetContext('testAnotherService'),
        testLambda: this.node.tryGetContext('testLambda'),
        testService: this.node.tryGetContext('testService'),
      },
    }
  }
}

class TestInvalidCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testLambda: this.node.tryGetContext('testLambda'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testRole = this.iamManager.createRoleForLambda(
      'test-role',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    const testLambda = this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )
    this.snsManager.createEmailNotificationService('test-email-service', this, this.props.testService, [
      'test@gradientedge.com',
    ])
    this.snsManager.createLambdaNotificationService(
      'test-lambda-service',
      this,
      this.props.testAnotherService,
      testLambda
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestSnsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Subscription props undefined')
  })
})

describe('TestSnsConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::SNS::Subscription', 2)
    template.resourceCountIs('AWS::SNS::Topic', 2)
    template.resourceCountIs('AWS::Lambda::Permission', 1)
  })
})

describe('TestSnsConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testEmailServiceSubscriptionArn', {})
    template.hasOutput('testEmailServiceSubscriptionName', {})
    template.hasOutput('testLambdaServiceSubscriptionArn', {})
    template.hasOutput('testLambdaServiceSubscriptionName', {})
  })
})

describe('TestSnsConstruct', () => {
  test('provisions new subscription as expected', () => {
    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
    })

    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'lambda',
    })
  })
})

describe('TestSnsConstruct', () => {
  test('provisions new topic as expected', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'cdktest-test-service-test',
      FifoTopic: false,
      TopicName: 'cdktest-test-service-test',
    })

    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'cdktest-test-another-service-test',
      FifoTopic: true,
      TopicName: 'cdktest-test-another-service-test.fifo',
    })
  })
})
