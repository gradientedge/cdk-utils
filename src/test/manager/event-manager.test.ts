import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
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
    'src/test/common/cdkConfig/ecs.json',
    'src/test/common/cdkConfig/lambdas.json',
    'src/test/common/cdkConfig/logs.json',
    'src/test/common/cdkConfig/rules.json',
    'src/test/common/cdkConfig/vpc.json',
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
      },
    }
  }
}

class TestInvalidCommonStack extends common.CommonStack {
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
      },
    }
  }
}

class TestCommonConstruct extends common.CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testVpc = this.vpcManager.createCommonVpc(this, this.props.testVpc)
    const testCluster = this.ecsManager.createEcsCluster('test-cluster', this, this.props.testCluster, testVpc)
    const testImage = ecs.ContainerImage.fromAsset('src/test/common/docker')
    const testLogGroup = this.logManager.createLogGroup('test-log-group', this, this.props.testLogGroup)
    const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    const testRole = this.iamManager.createRoleForEcsExecution('test-role', this, testPolicy)
    const testTask = this.ecsManager.createEcsFargateTask(
      'test-task',
      this,
      this.props.testTask,
      testCluster,
      testRole,
      testLogGroup,
      testImage
    )
    const testRoleForEvent = this.iamManager.createRoleForEcsEvent('test-ecs-role', this, testCluster, testTask)
    this.eventManager.createFargateTaskRule(
      'test-fargate-rule',
      this,
      this.props.testFargateRule,
      testCluster,
      testTask,
      [],
      testRoleForEvent
    )

    const testLambda = this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [],
      new lambda.AssetCode('src/test/common/nodejs/lib')
    )
    this.eventManager.createLambdaRule('test-lambda-rule', this, this.props.testLambdaRule, testLambda)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestEventConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('EventRule props undefined')
  })
})

describe('TestEventConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Events::Rule', 2)
    template.resourceCountIs('AWS::Lambda::Permission', 1)
  })
})

describe('TestEventConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testFargateRuleRuleArn', {})
    template.hasOutput('testFargateRuleRuleName', {})
    template.hasOutput('testLambdaRuleRuleArn', {})
    template.hasOutput('testLambdaRuleRuleName', {})
  })
})

describe('TestEventConstruct', () => {
  test('provisions new fargate event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Rule to send notification on new objects in data bucket to ecs task target',
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': ['testcommonstacktestclusterBBE459F3', 'Arn'],
          },
          EcsParameters: {
            LaunchType: 'FARGATE',
            NetworkConfiguration: {
              AwsVpcConfiguration: {
                AssignPublicIp: 'ENABLED',
                Subnets: [],
              },
            },
            TaskCount: 1,
            TaskDefinitionArn: {
              Ref: 'testcommonstacktesttask23AF6E18',
            },
          },
          Id: 'test-fargate-rule-test',
          RoleArn: {
            'Fn::GetAtt': ['testcommonstacktestecsrole9F6D8BF8', 'Arn'],
          },
        },
      ],
    })
  })

  test('provisions new lambda event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Rule to send notification to lambda function target',
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
          },
          Id: 'test-lambda-rule-test',
        },
      ],
    })
  })
})
