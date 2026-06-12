import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../src/index.js'
import {
  STUB_APP_CONFIG_ARN,
  STUB_DDB_TABLE_ARN,
  STUB_IAM_ROLE_ARN,
  STUB_KMS_KEY_ARN,
  STUB_S3_BUCKET_ARN,
  STUB_SECRET_ARN,
} from '../common/stubs.js'

interface TestStackProps extends CommonStackProps {
  testBucket: any
  testCluster: any
  testFargateRule: any
  testLambda: any
  testLambdaRule: any
  testLogGroup: any
  testSqs: any
  testSqsRule: any
  testTask: any
  testVpc: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdk-config/buckets.json',
    'packages/aws/test/common/cdk-config/ecs.json',
    'packages/aws/test/common/cdk-config/lambdas.json',
    'packages/aws/test/common/cdk-config/logs.json',
    'packages/aws/test/common/cdk-config/rules.json',
    'packages/aws/test/common/cdk-config/vpc.json',
    'packages/aws/test/common/cdk-config/sqs.json',
  ],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdk-env',
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
        testBucket: this.node.tryGetContext('siteBucket'),
        testCluster: this.node.tryGetContext('testCluster'),
        testFargateRule: this.node.tryGetContext('testLambda'),
        testLambda: this.node.tryGetContext('testLambda'),
        testLambdaRule: this.node.tryGetContext('testLambda'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSqsRule: this.node.tryGetContext('testSqsRule'),
        testTask: this.node.tryGetContext('testTask'),
        testVpc: this.node.tryGetContext('testVpc'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testLogGroup = this.logManager.createCfnLogGroup('test-log-group', this, this.props.testLogGroup)
    const testLogGroup2 = this.logManager.createLogGroup('test-log-group-2', this, this.props.testLogGroup)
    const testBucket = this.s3Manager.createS3Bucket('test-ct-bucket', this, this.props.testBucket)
    const testVpc = this.vpcManager.createCommonVpc(`${name}-vpc`, this, this.props.testVpc)
    const testCluster = this.ecsManager.createEcsCluster('test-cluster', this, this.props.testCluster, testVpc)
    const testImage = ecs.ContainerImage.fromAsset('packages/aws/test/common/docker')
    const testPolicy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForReadSecrets(this, [STUB_SECRET_ARN])],
    })
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

    this.iamManager.statementForReadSecrets(this, [STUB_SECRET_ARN])
    this.iamManager.statementForReadAnyAppConfig([STUB_APP_CONFIG_ARN])
    this.iamManager.statementForListBucket(this, testBucket)
    /* s3:ListAllMyBuckets does not support resource-level IAM */
    this.iamManager.statementForListAllMyBuckets(['*'])
    this.iamManager.statementForGetAnyS3Objects(this, testBucket)
    this.iamManager.statementForDeleteAnyS3Objects(this, testBucket)
    this.iamManager.statementForPutAnyS3Objects(this, testBucket)
    this.iamManager.statementForPassRole([STUB_IAM_ROLE_ARN])
    this.iamManager.statementForAssumeRole(this, [new iam.ServicePrincipal('s3')])
    this.iamManager.statementForEcsPassRole([STUB_IAM_ROLE_ARN])
    this.iamManager.statementForRunEcsTask(this, testCluster, testTask)
    this.iamManager.statementForCreateLogStream(this, testLogGroup)
    this.iamManager.statementForPutLogEvent(this, testLogGroup)
    this.iamManager.statementForReadTableItems([STUB_DDB_TABLE_ARN])
    this.iamManager.statementForWriteTableItems([STUB_DDB_TABLE_ARN])
    this.iamManager.statementForAppConfigExecution([STUB_APP_CONFIG_ARN])
    /* xray:PutTelemetryRecords / PutTraceSegments do not support resource-level IAM */
    this.iamManager.statementForPutXrayTelemetry(['*'])
    this.iamManager.statementForDecryptKms([STUB_KMS_KEY_ARN])
    this.iamManager.createRoleForCloudTrail('test-role-trail', this, testLogGroup)
    this.iamManager.createRoleForEcsEvent('test-role-ecs-event', this, testCluster, testTask)
    this.iamManager.createRoleForAppConfigSecrets(
      'test-role-appconfig-secrets',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this, [STUB_SECRET_ARN])] })
    )
    this.iamManager.createRoleForLambda(
      'test-role-lambda',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this, [STUB_SECRET_ARN])] })
    )

    /* Test SQS Document Policy Creation */
    const testSqs = this.sqsManager.createQueue('test-sqs', this, this.props.testSqs)
    const testSqsRule = this.eventManager.createRule('test-sqs-rule', this, this.props.testSqsRule, undefined, [
      new eventsTargets.SqsQueue(testSqs),
    ])
    this.iamManager.createPolicyForSqsEvent('test-policy-sqs-event', this, testSqs, testSqsRule)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestIamConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 6)
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
