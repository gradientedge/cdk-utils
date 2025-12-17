import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {
  testIPV6Vpc: any
  testVpc: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/vpc.json'],
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
      testIPV6Vpc: this.node.tryGetContext('testIPV6Vpc'),
      testVpc: this.node.tryGetContext('testVpc'),
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
      testVpc: this.node.tryGetContext('testVpc'),
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.vpcManager.createCommonVpc(`${name}-vpc`, this, this.props.testVpc, this.props.testVpc.vpcName)
    this.vpcManager.createVpc('test-ipv6-vpc', this, this.props.testIPV6Vpc)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestVpcConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Vpc props undefined')
  })
})

describe('TestVpcConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::EC2::VPC', 2)
    template.resourceCountIs('AWS::EC2::Subnet', 8)
    template.resourceCountIs('AWS::EC2::RouteTable', 8)
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 8)
    template.resourceCountIs('AWS::EC2::Route', 12)
    template.resourceCountIs('AWS::EC2::EIP', 4)
    template.resourceCountIs('AWS::EC2::NatGateway', 4)
    template.resourceCountIs('AWS::EC2::InternetGateway', 2)
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 2)
    template.resourceCountIs('AWS::EC2::VPCCidrBlock', 1)
  })
})

describe('TestVpcConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testCommonStackVpcId', {})
    template.hasOutput('testCommonStackVpcPublicSubnetIds', {})
    template.hasOutput('testCommonStackVpcPrivateSubnetIds', {})
    template.hasOutput('testCommonStackVpcPublicSubnetRouteTableIds', {})
    template.hasOutput('testCommonStackVpcPrivateSubnetRouteTableIds', {})
    template.hasOutput('testCommonStackVpcAvailabilityZones', {})
    template.hasOutput('testCommonStackVpcDefaultSecurityGroup', {})
    template.hasOutput('testIpv6VpcId', {})
    template.hasOutput('testIpv6VpcPublicSubnetIds', {})
    template.hasOutput('testIpv6VpcPrivateSubnetIds', {})
    template.hasOutput('testIpv6VpcPublicSubnetRouteTableIds', {})
    template.hasOutput('testIpv6VpcPrivateSubnetRouteTableIds', {})
    template.hasOutput('testIpv6VpcAvailabilityZones', {})
    template.hasOutput('testIpv6VpcDefaultSecurityGroup', {})
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new vpc as expected', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
      Tags: [
        {
          Key: 'Name',
          Value: 'cdktest-common-vpc-test',
        },
      ],
    })

    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
      Tags: [
        {
          Key: 'Name',
          Value: 'cdktest-common-ipv4-vpc-test',
        },
      ],
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new vpc subnets as expected', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AvailabilityZone: 'dummy1a',
      CidrBlock: '10.0.0.0/18',
      MapPublicIpOnLaunch: true,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'Public',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PublicSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AvailabilityZone: 'dummy1b',
      CidrBlock: '10.0.64.0/18',
      MapPublicIpOnLaunch: true,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'Public',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PublicSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AvailabilityZone: 'dummy1a',
      CidrBlock: '10.0.128.0/18',
      MapPublicIpOnLaunch: false,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'Private',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Private',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PrivateSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AvailabilityZone: 'dummy1b',
      CidrBlock: '10.0.192.0/18',
      MapPublicIpOnLaunch: false,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'Private',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Private',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PrivateSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AssignIpv6AddressOnCreation: true,
      AvailabilityZone: 'dummy1a',
      Ipv6CidrBlock: {
        'Fn::Select': [
          0,
          {
            'Fn::Cidr': [
              {
                'Fn::Select': [
                  0,
                  {
                    'Fn::GetAtt': ['testcommonstacktestipv6vpcB91AA9CB', 'Ipv6CidrBlocks'],
                  },
                ],
              },
              256,
              '64',
            ],
          },
        ],
      },
      Ipv6Native: true,
      MapPublicIpOnLaunch: false,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'cdktest-common-ipv4-vpc-test-public',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-publicSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AssignIpv6AddressOnCreation: true,
      AvailabilityZone: 'dummy1b',
      Ipv6CidrBlock: {
        'Fn::Select': [
          1,
          {
            'Fn::Cidr': [
              {
                'Fn::Select': [
                  0,
                  {
                    'Fn::GetAtt': ['testcommonstacktestipv6vpcB91AA9CB', 'Ipv6CidrBlocks'],
                  },
                ],
              },
              256,
              '64',
            ],
          },
        ],
      },
      Ipv6Native: true,
      MapPublicIpOnLaunch: false,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'cdktest-common-ipv4-vpc-test-public',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-publicSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AssignIpv6AddressOnCreation: true,
      AvailabilityZone: 'dummy1a',
      Ipv6CidrBlock: {
        'Fn::Select': [
          2,
          {
            'Fn::Cidr': [
              {
                'Fn::Select': [
                  0,
                  {
                    'Fn::GetAtt': ['testcommonstacktestipv6vpcB91AA9CB', 'Ipv6CidrBlocks'],
                  },
                ],
              },
              256,
              '64',
            ],
          },
        ],
      },
      Ipv6Native: true,
      MapPublicIpOnLaunch: false,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'cdktest-common-ipv4-vpc-test-private',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Private',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-privateSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })
    template.hasResourceProperties('AWS::EC2::Subnet', {
      AssignIpv6AddressOnCreation: true,
      AvailabilityZone: 'dummy1b',
      Ipv6CidrBlock: {
        'Fn::Select': [
          1,
          {
            'Fn::Cidr': [
              {
                'Fn::Select': [
                  0,
                  {
                    'Fn::GetAtt': ['testcommonstacktestipv6vpcB91AA9CB', 'Ipv6CidrBlocks'],
                  },
                ],
              },
              256,
              '64',
            ],
          },
        ],
      },
      Ipv6Native: true,
      MapPublicIpOnLaunch: false,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'cdktest-common-ipv4-vpc-test-public',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-publicSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new route tables as expected', () => {
    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PublicSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })

    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PublicSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })

    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PrivateSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })

    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PrivateSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestcommonstackvpcD67F1E27',
      },
    })

    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-publicSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })

    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-publicSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })

    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-privateSubnet1',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })

    template.hasResourceProperties('AWS::EC2::RouteTable', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-privateSubnet2',
        },
      ],
      VpcId: {
        Ref: 'testcommonstacktestipv6vpcB91AA9CB',
      },
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new subnet route table associations as expected', () => {
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet1RouteTableB0BB0283',
      },
      SubnetId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet1Subnet2C5C54CE',
      },
    })
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet2RouteTableC62CC65C',
      },
      SubnetId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet2Subnet59F247DC',
      },
    })
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPrivateSubnet1RouteTableD6E96AB0',
      },
      SubnetId: {
        Ref: 'testcommonstacktestcommonstackvpcPrivateSubnet1SubnetBF5BA88B',
      },
    })
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPrivateSubnet2RouteTableC17941EF',
      },
      SubnetId: {
        Ref: 'testcommonstacktestcommonstackvpcPrivateSubnet2Subnet5D0058D0',
      },
    })
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet1RouteTable8250924E',
      },
      SubnetId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet1Subnet0A3DA440',
      },
    })
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet2RouteTable3683D568',
      },
      SubnetId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet2Subnet6E5D2F9F',
      },
    })
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet1RouteTable2792D522',
      },
      SubnetId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet1Subnet73C10700',
      },
    })
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet2RouteTableAFB08AEE',
      },
      SubnetId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet2Subnet27C63831',
      },
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new routes as expected', () => {
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: {
        Ref: 'testcommonstacktestcommonstackvpcIGW984D47A2',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet1RouteTableB0BB0283',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: {
        Ref: 'testcommonstacktestcommonstackvpcIGW984D47A2',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet2RouteTableC62CC65C',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet1NATGateway29CBDD9F',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPrivateSubnet1RouteTableD6E96AB0',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet2NATGateway81C8BF0C',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestcommonstackvpcPrivateSubnet2RouteTableC17941EF',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: {
        Ref: 'testcommonstacktestipv6vpcIGW91A45734',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet1RouteTable8250924E',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationIpv6CidrBlock: '::/0',
      GatewayId: {
        Ref: 'testcommonstacktestipv6vpcIGW91A45734',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet1RouteTable8250924E',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: {
        Ref: 'testcommonstacktestipv6vpcIGW91A45734',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet2RouteTable3683D568',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationIpv6CidrBlock: '::/0',
      GatewayId: {
        Ref: 'testcommonstacktestipv6vpcIGW91A45734',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet2RouteTable3683D568',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet1NATGateway0699069D',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet1RouteTable2792D522',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationIpv6CidrBlock: '::/0',
      EgressOnlyInternetGatewayId: {
        Ref: 'testcommonstacktestipv6vpctestipv6vpceigw1DF87C6A',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet1RouteTable2792D522',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet2NATGateway4DBCF0EF',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet2RouteTableAFB08AEE',
      },
    })
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationIpv6CidrBlock: '::/0',
      EgressOnlyInternetGatewayId: {
        Ref: 'testcommonstacktestipv6vpctestipv6vpceigw1DF87C6A',
      },
      RouteTableId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestprivateSubnet2RouteTableAFB08AEE',
      },
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new elastic IPs as expected', () => {
    template.hasResourceProperties('AWS::EC2::EIP', {
      Domain: 'vpc',
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new nat gateway as expected', () => {
    template.hasResourceProperties('AWS::EC2::NatGateway', {
      AllocationId: {
        'Fn::GetAtt': ['testcommonstacktestcommonstackvpcPublicSubnet1EIPC233721F', 'AllocationId'],
      },
      SubnetId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet1Subnet2C5C54CE',
      },
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PublicSubnet1',
        },
      ],
    })
    template.hasResourceProperties('AWS::EC2::NatGateway', {
      AllocationId: {
        'Fn::GetAtt': ['testcommonstacktestcommonstackvpcPublicSubnet2EIP904C6AC0', 'AllocationId'],
      },
      SubnetId: {
        Ref: 'testcommonstacktestcommonstackvpcPublicSubnet2Subnet59F247DC',
      },
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-common-stack-vpc/PublicSubnet2',
        },
      ],
    })
    template.hasResourceProperties('AWS::EC2::NatGateway', {
      AllocationId: {
        'Fn::GetAtt': ['testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet1EIP9FEE8E83', 'AllocationId'],
      },
      SubnetId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet1Subnet0A3DA440',
      },
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-publicSubnet1',
        },
      ],
    })
    template.hasResourceProperties('AWS::EC2::NatGateway', {
      AllocationId: {
        'Fn::GetAtt': ['testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet2EIP1B676341', 'AllocationId'],
      },
      SubnetId: {
        Ref: 'testcommonstacktestipv6vpccdktestcommonipv4vpctestpublicSubnet2Subnet6E5D2F9F',
      },
      Tags: [
        {
          Key: 'Name',
          Value: 'test-common-stack/test-common-stack/test-ipv6-vpc/cdktest-common-ipv4-vpc-test-publicSubnet2',
        },
      ],
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new vpc gateway attachment as expected', () => {
    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
      InternetGatewayId: { Ref: 'testcommonstacktestcommonstackvpcIGW984D47A2' },
      VpcId: { Ref: 'testcommonstacktestcommonstackvpcD67F1E27' },
    })
    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
      InternetGatewayId: { Ref: 'testcommonstacktestipv6vpcIGW91A45734' },
      VpcId: { Ref: 'testcommonstacktestipv6vpcB91AA9CB' },
    })
  })
})

describe('TestVpcConstruct', () => {
  test('provisions new ipv6 vpc cidr block as expected', () => {
    template.hasResourceProperties('AWS::EC2::VPCCidrBlock', {
      AmazonProvidedIpv6CidrBlock: true,
      VpcId: { Ref: 'testcommonstacktestipv6vpcB91AA9CB' },
    })
  })
})
