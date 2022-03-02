import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  testVpc: any
  testCluster: any
  testLogGroup: any
  testTask: any
  testLambda: any
  testFargateRule: any
  testLambdaRule: any
  testBucket: any
  testSqs: any
  testSqsRule: any
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
  extraContexts: [
    'src/test/common/cdkConfig/buckets.json',
    'src/test/common/cdkConfig/ecs.json',
    'src/test/common/cdkConfig/lambdas.json',
    'src/test/common/cdkConfig/logs.json',
    'src/test/common/cdkConfig/rules.json',
    'src/test/common/cdkConfig/vpc.json',
    'src/test/common/cdkConfig/sqs.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testVpc: this.node.tryGetContext('testVpc'),
        testCluster: this.node.tryGetContext('testCluster'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testTask: this.node.tryGetContext('testTask'),
        testLambda: this.node.tryGetContext('testLambda'),
        testFargateRule: this.node.tryGetContext('testLambda'),
        testLambdaRule: this.node.tryGetContext('testLambda'),
        testBucket: this.node.tryGetContext('siteBucket'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSqsRule: this.node.tryGetContext('testSqsRule'),
      },
    }
  }
}

class TestCommonConstruct extends common.CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testLogGroup = this.logManager.createCfnLogGroup('test-log-group', this, this.props.testLogGroup)
    const testLogGroup2 = this.logManager.createLogGroup('test-log-group-2', this, this.props.testLogGroup)
    const testBucket = this.s3Manager.createS3Bucket('test-ct-bucket', this, this.props.testBucket)
    const testVpc = this.vpcManager.createCommonVpc(this, this.props.testVpc)
    const testCluster = this.ecsManager.createEcsCluster('test-cluster', this, this.props.testCluster, testVpc)
    const testImage = ecs.ContainerImage.fromAsset('src/test/common/docker')
    const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    const testRole = this.iamManager.createRoleForEcsExecution('test-role', this, testPolicy)
    const testTask = this.ecsManager.createEcsFargateTask(
      'test-task',
      this,
      this.props.testTask,
      testCluster,
      testRole,
      testLogGroup2,
      testImage
    )
    const testSqs = this.sqsManager.createQueueService('test-sqs', this, this.props.testSqs)
    const testSqsRule = this.eventManager.createSqsRule('test-sqs-rule', this, this.props.testSqsRule, testSqs)

    this.iamManager.statementForReadSecrets(this)
    this.iamManager.statementForReadAnyAppConfig()
    this.iamManager.statementForListBucket(this, testBucket)
    this.iamManager.statementForListAllMyBuckets()
    this.iamManager.statementForGetAnyS3Objects(this, testBucket)
    this.iamManager.statementForDeleteAnyS3Objects(this, testBucket)
    this.iamManager.statementForPutAnyS3Objects(this, testBucket)
    this.iamManager.statementForPassRole()
    this.iamManager.statementForAssumeRole(this, [new iam.ServicePrincipal('s3')])
    this.iamManager.statementForEcsPassRole()
    this.iamManager.statementForRunEcsTask(this, testCluster, testTask)
    this.iamManager.statementForCreateLogStream(this, testLogGroup)
    this.iamManager.statementForPutLogEvent(this, testLogGroup)
    this.iamManager.createRoleForCloudTrail('test-role-trail', this, testLogGroup)
    this.iamManager.createRoleForEcsEvent('test-role-ecs-event', this, testCluster, testTask)
    this.iamManager.createRoleForLambda(
      'test-role-lambda',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    this.iamManager.createPolicyForSqsEvent('test-policy-sqs-event', this, testSqs, testSqsRule)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestIamConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 5)
  })
})

describe('TestIamConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testRoleArn', {})
    template.hasOutput('testRoleName', {})
    template.hasOutput('testRoleTrailArn', {})
    template.hasOutput('testRoleTrailName', {})
    template.hasOutput('testRoleEcsEventArn', {})
    template.hasOutput('testRoleEcsEventName', {})
    template.hasOutput('testRoleLambdaArn', {})
    template.hasOutput('testRoleLambdaName', {})
  })
})
