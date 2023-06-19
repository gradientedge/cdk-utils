import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../lib'

interface TestStackProps extends CommonStackProps {
  testLambda: any
  testService: any
  testAnotherService: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: ['src/test/common/cdkConfig/lambdas.json', 'src/test/common/cdkConfig/services.json'],
  stageContextPath: 'src/test/common/cdkEnv',
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
        testLambda: this.node.tryGetContext('testLambda'),
        testService: this.node.tryGetContext('testService'),
        testAnotherService: this.node.tryGetContext('testAnotherService'),
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
      new lambda.AssetCode('src/test/common/nodejs/lib')
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
      DisplayName: 'test-service-test',
      TopicName: 'test-service-test',
      FifoTopic: false,
    })

    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'test-another-service-test',
      TopicName: 'test-another-service-test.fifo',
      FifoTopic: true,
    })
  })
})
