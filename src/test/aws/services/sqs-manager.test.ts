import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testLambdaWithDlq: any
  testSqs: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'src/test/aws/common/cdkConfig/lambdas.json',
    'src/test/aws/common/cdkConfig/rules.json',
    'src/test/aws/common/cdkConfig/sqs.json',
  ],
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
        testLambdaWithDlq: this.node.tryGetContext('testLambdaWithDlq'),
        testSqs: this.node.tryGetContext('testSqs'),
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
        testSqs: this.node.tryGetContext('testInvalidSqs'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)

    this.sqsManager.createQueue('test-sqs', this, this.props.testSqs)
    const redriveQueue = this.sqsManager.createRedriveQueueForLambda('test-rdq', this, this.props.testLambdaWithDlq)
    this.sqsManager.createDeadLetterQueueForLambda('test-dlq', this, this.props.testLambdaWithDlq, redriveQueue)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestSqsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Queue props undefined')
  })
})

describe('TestSqsConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::SQS::Queue', 3)
  })
})

describe('TestSqsConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testSqsQueueArn', {})
    template.hasOutput('testSqsQueueName', {})
    template.hasOutput('testSqsQueueUrl', {})
    template.hasOutput('testRdqQueueArn', {})
    template.hasOutput('testRdqQueueName', {})
    template.hasOutput('testRdqQueueUrl', {})
    template.hasOutput('testDlqQueueArn', {})
    template.hasOutput('testDlqQueueName', {})
    template.hasOutput('testDlqQueueUrl', {})
  })
})

describe('TestSqsConstruct', () => {
  test('provisions new queue as expected', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 604800,
      QueueName: 'test-sqs',
      ReceiveMessageWaitTimeSeconds: 20,
      VisibilityTimeout: 300,
    })
  })

  test('provisions new redrive queue as expected', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 604800,
      QueueName: 'test-lambda-with-error-handling-redriveq-test',
      ReceiveMessageWaitTimeSeconds: 20,
      VisibilityTimeout: 300,
    })
  })

  test('provisions new dead letter queue as expected', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 604800,
      QueueName: 'test-lambda-with-error-handling-dlq-test',
      ReceiveMessageWaitTimeSeconds: 20,
      VisibilityTimeout: 300,
    })
  })
})
