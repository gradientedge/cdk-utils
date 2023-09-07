import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testFileSystem: any
  testFileSystemAccessPoints: any[]
  testVpc: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/fileSystems.json', 'src/test/aws/common/cdkConfig/vpc.json'],
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
        testFileSystem: this.node.tryGetContext('testFileSystem'),
        testFileSystemAccessPoints: this.node.tryGetContext('testFileSystemAccessPoints'),
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
    const testVpc = this.vpcManager.createVpc('test-vpc', this, this.props.testVpc)
    this.efsManager.createFileSystem(
      `test-file-system`,
      this,
      this.props.testFileSystem,
      testVpc,
      this.props.testFileSystemAccessPoints
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestEfsManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('EFS props undefined')
  })
})

describe('TestEfsManager', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::EC2::VPC', 1)
    template.resourceCountIs('AWS::EC2::Route', 4)
    template.resourceCountIs('AWS::EC2::RouteTable', 4)
    template.resourceCountIs('AWS::EC2::Subnet', 4)
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4)
    template.resourceCountIs('AWS::EC2::EIP', 2)
    template.resourceCountIs('AWS::EC2::NatGateway', 2)
    template.resourceCountIs('AWS::EC2::InternetGateway', 1)
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1)
    template.resourceCountIs('AWS::EFS::FileSystem', 1)
    template.resourceCountIs('AWS::EFS::AccessPoint', 1)
    template.resourceCountIs('AWS::EFS::MountTarget', 2)
  })
})

describe('TestEfsManager', () => {
  test('outputs as expected', () => {
    template.hasOutput('testVpcId', {})
    template.hasOutput('testVpcPublicSubnetIds', {})
    template.hasOutput('testVpcPrivateSubnetIds', {})
    template.hasOutput('testVpcPublicSubnetRouteTableIds', {})
    template.hasOutput('testVpcPrivateSubnetRouteTableIds', {})
    template.hasOutput('testVpcAvailabilityZones', {})
    template.hasOutput('testVpcDefaultSecurityGroup', {})
    template.hasOutput('testFileSystemFileSystemArn', {})
    template.hasOutput('testFileSystemFileSystemId', {})
    template.hasOutput('testFileSystemAccessPointArn0', {})
    template.hasOutput('testFileSystemAccessPointId0', {})
  })
})

describe('TestEfsManager', () => {
  test('provisions efs as expected', () => {
    template.hasResourceProperties('AWS::EFS::FileSystem', {
      Encrypted: true,
      FileSystemTags: [{ Key: 'Name', Value: 'testfs-test' }],
      LifecyclePolicies: [{ TransitionToIA: 'AFTER_7_DAYS' }, { TransitionToPrimaryStorageClass: 'AFTER_1_ACCESS' }],
      PerformanceMode: 'generalPurpose',
    })
  })
})

describe('TestEfsManager', () => {
  test('provisions efs access point as expected', () => {
    template.hasResourceProperties('AWS::EFS::AccessPoint', {
      AccessPointTags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-file-system/test-file-system-ap-0',
        },
      ],
      FileSystemId: {
        Ref: 'testcommonstacktestfilesystemDD85B225',
      },
      PosixUser: {
        Gid: '1000',
        Uid: '1000',
      },
      RootDirectory: {
        CreationInfo: {
          OwnerGid: '1000',
          OwnerUid: '1000',
          Permissions: '755',
        },
        Path: '/uploads',
      },
    })
  })
})

describe('TestEfsManager', () => {
  test('provisions efs mount targets as expected', () => {
    template.hasResourceProperties('AWS::EFS::MountTarget', {
      FileSystemId: {
        Ref: 'testcommonstacktestfilesystemDD85B225',
      },
      SecurityGroups: [
        {
          'Fn::GetAtt': ['testcommonstacktestfilesystemEfsSecurityGroupD852727D', 'GroupId'],
        },
      ],
      SubnetId: {
        Ref: 'testcommonstacktestvpcPrivateSubnet1Subnet9D6C7155',
      },
    })

    template.hasResourceProperties('AWS::EFS::MountTarget', {
      FileSystemId: {
        Ref: 'testcommonstacktestfilesystemDD85B225',
      },
      SecurityGroups: [
        {
          'Fn::GetAtt': ['testcommonstacktestfilesystemEfsSecurityGroupD852727D', 'GroupId'],
        },
      ],
      SubnetId: {
        Ref: 'testcommonstacktestvpcPrivateSubnet2Subnet60730BA2',
      },
    })
  })
})
