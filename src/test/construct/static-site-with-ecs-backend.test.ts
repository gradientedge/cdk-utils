import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { CommonStack, SiteWithEcsBackend, SiteWithEcsBackendProps } from '../../lib'

interface TestStackProps extends SiteWithEcsBackendProps {
  testAttribute?: string
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

    this.construct = new TestSiteWithEcsBackendConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        siteAliases: [`${this.node.tryGetContext('siteSubDomain')}.${this.fullyQualifiedDomain()}`],
        siteCacheInvalidationDockerFilePath: `src/test/common/docker`,
        siteCachePolicy: this.node.tryGetContext('siteCachePolicy'),
        siteCertificate: this.node.tryGetContext('siteCertificate'),
        siteCloudfrontFunctionProps: this.node.tryGetContext('testSite'),
        siteCluster: this.node.tryGetContext('testCluster'),
        siteDistribution: this.node.tryGetContext('siteDistribution'),
        siteEcsContainerImagePath: `src/test/common/docker`,
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

class TestSiteWithEcsBackendConstruct extends SiteWithEcsBackend {
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

describe('TestSiteWithEcsBackendConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
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
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2)
    template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 1)
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1)
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1)
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 2)
    template.resourceCountIs('AWS::CodeBuild::Project', 1)
    template.resourceCountIs('Custom::AWS', 1)
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::CloudFront::Function', 1)
    template.resourceCountIs('AWS::CloudFront::CachePolicy', 1)
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
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
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
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

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions site distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['site-test.test.gradientedge.io'],
        Comment: 'test-site-distribution - test stage',
        DefaultCacheBehavior: {
          CachePolicyId: {
            Ref: 'testsitestacktestsitesitecachepolicy3FFA1F0E',
          },
          Compress: true,
          FunctionAssociations: [
            {
              EventType: 'viewer-request',
              FunctionARN: {
                'Fn::GetAtt': ['testsitestacktestsitefunctionF68C253C', 'FunctionARN'],
              },
            },
          ],
          TargetOriginId: 'test-site-server',
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
            Id: 'test-site-server',
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

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions vpc as expected', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
    })
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions cluster as expected', () => {
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'test-storefront-test',
    })
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions load balancer as expected', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: 'site-load-balancer-test',
      Scheme: 'internet-facing',
      Type: 'application',
    })
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions load listener as expected', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS',
    })
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
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

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions task definition as expected', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: '2048',
      Memory: '4096',
      NetworkMode: 'awsvpc',
    })
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions codebuild project as expected', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      EncryptionKey: 'alias/aws/s3',
      TimeoutInMinutes: 5,
    })
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
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

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions cloudfront function as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Function', {
      FunctionConfig: {
        Comment: 'test comment',
      },
      Name: 'test-site-function-test',
    })
  })
})

describe('TestSiteWithEcsBackendConstruct', () => {
  test('provisions cloudfront cache policy as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
      CachePolicyConfig: {
        Comment: 'Policy for test-site-distribution - test stage',
        DefaultTTL: 86400,
        MaxTTL: 2592000,
        MinTTL: 60,
        Name: 'test-site-site-cache-policy',
      },
    })
  })
})
