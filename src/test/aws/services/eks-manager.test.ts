import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testEks: any
  testVpc: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/eks.json', 'src/test/aws/common/cdkConfig/vpc.json'],
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
        testEks: this.node.tryGetContext('testEks'),
        testVpc: this.node.tryGetContext('testVpc'),
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
        testVpc: this.node.tryGetContext('testVpc'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testVpc = this.vpcManager.createCommonVpc(`${name}-vpc`, this, this.props.testVpc)
    const testImage = this.ecrManager.createDockerImage('test-image', this, 'src/test/aws/common/docker')
    this.eksManager.createEksDeployment('test-depl', this, this.props.testEks, testImage, testVpc)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestEksConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('EksCluster props undefined')
  })
})

describe('TestEksConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 4)
    template.resourceCountIs('AWS::IAM::Policy', 2)
    template.resourceCountIs('AWS::EC2::SecurityGroup', 1)
    template.resourceCountIs('AWS::SSM::Parameter', 1)
    template.resourceCountIs('AWS::CloudFormation::Stack', 2)
    template.resourceCountIs('Custom::AWSCDK-EKS-Cluster', 1)
    template.resourceCountIs('Custom::AWSCDK-EKS-KubernetesResource', 2)
  })
})

describe('TestEksConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testDeplClusterArn', {})
    template.hasOutput('testDeplClusterEndpoint', {})
  })
})

describe('TestEksConstruct', () => {
  test('provisions new cluster as expected', () => {
    template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
      Config: {
        name: 'cdktest-test-cluster-test',
      },
    })
  })
})
