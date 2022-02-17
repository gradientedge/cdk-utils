import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  testVpc: any
  testElastiCache: any
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
  extraContexts: ['src/test/common/cdkConfig/vpc.json', 'src/test/common/cdkConfig/elasticache.json'],
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
        testElastiCache: this.node.tryGetContext('testElastiCache'),
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
      },
    }
  }
}

class TestCommonConstruct extends common.CommonConstruct {
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
    template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1)
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
