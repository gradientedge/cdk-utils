import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { CommonStack, SiteWithEcsBackend, SiteWithEcsBackendProps } from '../../lib'

interface TestStackProps extends SiteWithEcsBackendProps {
  testAttribute?: string
  siteFileSystem: any
  siteFileSystemAccessPoints: any[]
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'src/test/common/cdkConfig/dummy.json',
    'src/test/common/cdkConfig/buckets.json',
    'src/test/common/cdkConfig/certificates.json',
    'src/test/common/cdkConfig/clusters.json',
    'src/test/common/cdkConfig/distributions.json',
    'src/test/common/cdkConfig/fileSystems.json',
    'src/test/common/cdkConfig/healthCheck.json',
    'src/test/common/cdkConfig/logs.json',
    'src/test/common/cdkConfig/tasks.json',
    'src/test/common/cdkConfig/vpc.json',
    'src/test/common/cdkConfig/function.json',
  ],
  name: 'test-site-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestSiteWithEcsBackendAndEfsConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        siteAliases: [`${this.node.tryGetContext('siteSubDomain')}.${this.fullyQualifiedDomain()}`],
        siteCacheInvalidationDockerFilePath: `src/test/common/docker`,
        siteCertificate: this.node.tryGetContext('siteCertificate'),
        siteCloudfrontFunctionProps: this.node.tryGetContext('testSite'),
        siteCluster: this.node.tryGetContext('testCluster'),
        siteDistribution: this.node.tryGetContext('siteDistribution'),
        siteEcsContainerImagePath: `src/test/common/docker`,
        siteFileSystem: this.node.tryGetContext('siteFileSystem'),
        siteFileSystemAccessPoints: this.node.tryGetContext('siteFileSystemAccessPoints'),
        siteHealthCheck: this.node.tryGetContext('siteHealthCheck'),
        siteLog: this.node.tryGetContext('testLogGroup'),
        siteLogBucket: this.node.tryGetContext('siteLogBucket'),
        siteRecordName: this.node.tryGetContext('siteSubDomain'),
        siteRegionalCertificate: {
          domainName: this.fullyQualifiedDomain(),
          subjectAlternativeNames: [`*.${this.fullyQualifiedDomain()}`],
          useExistingCertificate: false,
        },
        siteSource: s3deploy.Source.asset('src/test/common/nodejs/lib'),
        siteSubDomain: this.node.tryGetContext('siteSubDomain'),
        siteTask: this.node.tryGetContext('testTask'),
        siteVpc: this.node.tryGetContext('testVpc'),
        testAttribute: this.node.tryGetContext('testAttribute'),
        timezone: this.node.tryGetContext('timezone'),
        useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
      },
    }
  }
}

class TestSiteWithEcsBackendAndEfsConstruct extends SiteWithEcsBackend {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-site'

    this.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-site-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 0)
    template.resourceCountIs('AWS::EC2::VPC', 1)
    template.resourceCountIs('AWS::EC2::Route', 4)
    template.resourceCountIs('AWS::EC2::RouteTable', 4)
    template.resourceCountIs('AWS::EC2::Subnet', 4)
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4)
    template.resourceCountIs('AWS::EC2::EIP', 2)
    template.resourceCountIs('AWS::EC2::NatGateway', 2)
    template.resourceCountIs('AWS::EC2::InternetGateway', 1)
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1)
    template.resourceCountIs('AWS::IAM::Role', 4)
    template.resourceCountIs('AWS::IAM::Policy', 3)
    template.resourceCountIs('AWS::ECS::Cluster', 1)
    template.resourceCountIs('AWS::ECS::TaskDefinition', 1)
    template.resourceCountIs('AWS::Logs::LogGroup', 2)
    template.resourceCountIs('AWS::EC2::SecurityGroup', 3)
    template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 3)
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1)
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1)
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 2)
    template.resourceCountIs('AWS::CodeBuild::Project', 1)
    template.resourceCountIs('Custom::AWS', 1)
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::CloudFront::Function', 1)
    template.resourceCountIs('AWS::EFS::FileSystem', 1)
    template.resourceCountIs('AWS::EFS::AccessPoint', 2)
    template.resourceCountIs('AWS::EFS::MountTarget', 2)
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testSiteHostedZoneHostedZoneId', {})
    template.hasOutput('testSiteHostedZoneHostedZoneArn', {})
    template.hasOutput('testSiteCertificateCertificateArn', {})
    template.hasOutput('commonVpcId', {})
    template.hasOutput('commonVpcPublicSubnetIds', {})
    template.hasOutput('commonVpcPrivateSubnetIds', {})
    template.hasOutput('commonVpcPublicSubnetRouteTableIds', {})
    template.hasOutput('commonVpcPrivateSubnetRouteTableIds', {})
    template.hasOutput('commonVpcAvailabilityZones', {})
    template.hasOutput('testSiteEcsRoleArn', {})
    template.hasOutput('testSiteEcsRoleName', {})
    template.hasOutput('testSiteClusterClusterArn', {})
    template.hasOutput('testSiteClusterClusterName', {})
    template.hasOutput('testSiteEcsLogGroupLogGroupArn', {})
    template.hasOutput('testsitestacktestsiteecsserviceLoadBalancerDNS9EF5DCE6', {})
    template.hasOutput('testsitestacktestsiteecsserviceServiceURLAEFD5591', {})
    template.hasOutput('testSiteSiteLogsBucketName', {})
    template.hasOutput('testSiteSiteLogsBucketArn', {})
    template.hasOutput('testSiteDistributionDistributionId', {})
    template.hasOutput('testSiteDistributionDistributionDomainName', {})
    template.hasOutput('testSiteARecordARecordDomainName', {})
    template.hasOutput('testSiteCacheInvalidationBuildImageDockerImageArn', {})
    template.hasOutput('testSiteCacheInvalidationProjectLogGroupLogGroupArn', {})
    template.hasOutput('testSiteLoadBalancerArn', {})
    template.hasOutput('testSiteLoadBalancerName', {})
    template.hasOutput('testSiteLoadBalancerFullName', {})
    template.hasOutput('testSiteLoadBalancerDnsName', {})
    template.hasOutput('testSiteFsFileSystemArn', {})
    template.hasOutput('testSiteFsFileSystemId', {})
    template.hasOutput('testSiteFsAccessPointArn0', {})
    template.hasOutput('testSiteFsAccessPointId0', {})
    template.hasOutput('testSiteFsAccessPointArn1', {})
    template.hasOutput('testSiteFsAccessPointId1', {})
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions site log bucket as expected', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      AccessControl: 'LogDeliveryWrite',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      BucketName: 'site-logs-test.test.gradientedge.io',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      Tags: [
        {
          Key: 'aws-cdk:auto-delete-objects',
          Value: 'true',
        },
      ],
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions site distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['site-test.test.gradientedge.io'],
        Comment: 'test-site-distribution - test stage',
        DefaultCacheBehavior: {
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
          Compress: true,
          FunctionAssociations: [
            {
              EventType: 'viewer-request',
              FunctionARN: {
                'Fn::GetAtt': ['testsitestacktestsitefunctionF68C253C', 'FunctionARN'],
              },
            },
          ],
          TargetOriginId: 'testsitestacktestsitedistributionOrigin14E765772',
          ViewerProtocolPolicy: 'redirect-to-https',
        },
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Logging: {
          Bucket: {
            'Fn::GetAtt': ['testsitestacktestsitesitelogsbucketD61B0D8C', 'RegionalDomainName'],
          },
          IncludeCookies: true,
          Prefix: 'edge/',
        },
        Origins: [
          {
            CustomOriginConfig: {
              HTTPPort: 443,
              OriginProtocolPolicy: 'https-only',
              OriginSSLProtocols: ['TLSv1.2'],
            },
            DomainName: 'site-internal-test.test.gradientedge.io',
            Id: 'testsitestacktestsitedistributionOrigin14E765772',
          },
        ],
        PriceClass: 'PriceClass_All',
        ViewerCertificate: {
          AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789:certificate/12345a67-8f85-46da-8441-88c998b4bd64',
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only',
        },
      },
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions vpc as expected', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions cluster as expected', () => {
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'test-storefront-test',
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions load balancer as expected', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: 'site-load-balancer-test',
      Scheme: 'internet-facing',
      Type: 'application',
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions load listener as expected', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS',
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions target group as expected', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 30,
      HealthCheckPath: '/',
      HealthCheckTimeoutSeconds: 5,
      Port: 80,
      Protocol: 'HTTP',
      TargetType: 'ip',
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions task definition as expected', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Essential: true,
          Image: {
            'Fn::Sub':
              '123456789.dkr.ecr.eu-west-1.${AWS::URLSuffix}/cdk-hnb659fds-container-assets-123456789-eu-west-1:460140ea11213855346dc4cb5e36128373384a708c6fd0e1ebc430045456f073',
          },
          LogConfiguration: {
            LogDriver: 'awslogs',
            Options: {
              'awslogs-group': {
                Ref: 'testsitestacktestsiteecsloggroupBD0E035B',
              },
              'awslogs-region': 'eu-west-1',
              'awslogs-stream-prefix': 'test-site-test/ecs',
            },
          },
          MountPoints: [
            {
              ContainerPath: '/test',
              ReadOnly: false,
              SourceVolume: 'test-site-fs',
            },
            {
              ContainerPath: '/test2',
              ReadOnly: false,
              SourceVolume: 'test-site-fs',
            },
          ],
          Name: 'web',
          PortMappings: [
            {
              ContainerPort: 3000,
              Protocol: 'tcp',
            },
          ],
        },
      ],
      Cpu: '2048',
      ExecutionRoleArn: {
        'Fn::GetAtt': ['testsitestacktestsiteecsroleB187E425', 'Arn'],
      },
      Family: 'testsitestacktestsiteecsserviceTaskDefC24B7672',
      Memory: '4096',
      NetworkMode: 'awsvpc',
      RequiresCompatibilities: ['FARGATE'],
      TaskRoleArn: {
        'Fn::GetAtt': ['testsitestacktestsiteecsroleB187E425', 'Arn'],
      },
      Volumes: [
        {
          EFSVolumeConfiguration: {
            FilesystemId: {
              Ref: 'testsitestacktestsitefs4DAB9666',
            },
          },
          Name: 'test-site-fs',
        },
      ],
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions codebuild project as expected', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      EncryptionKey: 'alias/aws/s3',
      TimeoutInMinutes: 5,
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'site-internal-test.test.gradientedge.io.',
      Type: 'A',
    })
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'site-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestSiteWithEcsBackendAndEfsConstruct', () => {
  test('provisions cloudfront function as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Function', {
      FunctionConfig: {
        Comment: 'test comment',
      },
      Name: 'test-site-function-test',
    })
  })
})

describe('TestEfsManager', () => {
  test('provisions site efs as expected', () => {
    template.hasResourceProperties('AWS::EFS::FileSystem', {
      Encrypted: true,
      FileSystemTags: [{ Key: 'Name', Value: 'sitefs-test' }],
      LifecyclePolicies: [{ TransitionToIA: 'AFTER_7_DAYS' }, { TransitionToPrimaryStorageClass: 'AFTER_1_ACCESS' }],
      PerformanceMode: 'generalPurpose',
    })
  })
})

describe('TestEfsManager', () => {
  test('provisions site efs access points as expected', () => {
    template.hasResourceProperties('AWS::EFS::AccessPoint', {
      AccessPointTags: [
        {
          Key: 'Name',
          Value: 'test-site-stack/test-site-stack/test-site-fs/test-site-fs-ap-0',
        },
      ],
      FileSystemId: {
        Ref: 'testsitestacktestsitefs4DAB9666',
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

    template.hasResourceProperties('AWS::EFS::AccessPoint', {
      AccessPointTags: [
        {
          Key: 'Name',
          Value: 'test-site-stack/test-site-stack/test-site-fs/test-site-fs-ap-1',
        },
      ],
      FileSystemId: {
        Ref: 'testsitestacktestsitefs4DAB9666',
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
        Path: '/downloads',
      },
    })
  })
})

describe('TestEfsManager', () => {
  test('provisions site efs mount targets as expected', () => {
    template.hasResourceProperties('AWS::EFS::MountTarget', {
      FileSystemId: {
        Ref: 'testsitestacktestsitefs4DAB9666',
      },
      SecurityGroups: [
        {
          'Fn::GetAtt': ['testsitestacktestsitefsEfsSecurityGroup16634C33', 'GroupId'],
        },
      ],
      SubnetId: {
        Ref: 'testsitestackCommonVpcPrivateSubnet1Subnet81D11B6D',
      },
    })

    template.hasResourceProperties('AWS::EFS::MountTarget', {
      FileSystemId: {
        Ref: 'testsitestacktestsitefs4DAB9666',
      },
      SecurityGroups: [
        {
          'Fn::GetAtt': ['testsitestacktestsitefsEfsSecurityGroup16634C33', 'GroupId'],
        },
      ],
      SubnetId: {
        Ref: 'testsitestackCommonVpcPrivateSubnet2SubnetB177B853',
      },
    })
  })
})
