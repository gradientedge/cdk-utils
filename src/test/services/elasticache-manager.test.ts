import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../lib'

interface TestStackProps extends CommonStackProps {
  testElastiCache: any
  testReplicatedElastiCache: any
  testVpc: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/common/cdkConfig/vpc.json', 'src/test/common/cdkConfig/elasticache.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
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
        testElastiCache: this.node.tryGetContext('testElastiCache'),
        testReplicatedElastiCache: this.node.tryGetContext('testReplicatedElastiCache'),
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
    const testVpc = this.vpcManager.createCommonVpc(this, this.props.testVpc)

    this.elasticacheManager.createElastiCache(
      'test-elasticache',
      this,
      this.props.testElastiCache,
      testVpc.privateSubnets.map(subnet => subnet.subnetId),
      [testVpc.vpcDefaultSecurityGroup]
    )

    this.elasticacheManager.createReplicatedElastiCache(
      'test-replicated-elasticache',
      this,
      this.props.testReplicatedElastiCache,
      testVpc.privateSubnets.map(subnet => subnet.subnetId),
      [testVpc.vpcDefaultSecurityGroup]
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestElastiCacheConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('ElastiCache props undefined')
  })
})

describe('TestElastiCacheConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::ElastiCache::CacheCluster', 1)
    template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1)
    template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 2)
  })
})

describe('TestElastiCacheConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testElasticacheRedisEndpointAddress', {})
    template.hasOutput('testElasticacheRedisEndpointPort', {})
    template.hasOutput('testElasticacheClusterName', {})
  })
})

describe('TestElastiCacheConstruct', () => {
  test('provisions new elastiCache as expected', () => {
    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
      ClusterName: 'test-elasticache-test',
      Engine: 'redis',
    })
  })
})

describe('TestElastiCacheConstruct', () => {
  test('provisions new replicated elastiCache as expected', () => {
    template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
      Engine: 'redis',
      ReplicationGroupId: 'test-replicated-elasticache-test',
    })
  })
})
