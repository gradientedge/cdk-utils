import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  testEvidentlyProject: types.EvidentlyProjectProps
  testEvidentlyFeature: types.EvidentlyFeatureProps
  testEvidentlyLaunch: types.EvidentlyLaunchProps
  testEvidentlyExperiment: types.EvidentlyExperimentProps
  testEvidentlySegment: types.EvidentlySegmentProps
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
  extraContexts: ['src/test/common/cdkConfig/evidently.json'],
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
        testEvidentlyProject: this.node.tryGetContext('testEvidentlyProject'),
        testEvidentlyFeature: this.node.tryGetContext('testEvidentlyFeature'),
        testEvidentlyLaunch: this.node.tryGetContext('testEvidentlyLaunch'),
        testEvidentlyExperiment: this.node.tryGetContext('testEvidentlyExperiment'),
        testEvidentlySegment: this.node.tryGetContext('testEvidentlySegment'),
      },
    }
  }
}

class TestCommonConstruct extends common.CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const project = this.evidentlyManager.createProject('testProject', this, this.props.testEvidentlyProject)
    this.evidentlyManager.createFeature('test-feature', this, {
      ...this.props.testEvidentlyFeature,
      project: project.attrArn,
    })
    this.evidentlyManager.createLaunch('test-launch', this, {
      ...this.props.testEvidentlyLaunch,
      project: project.attrArn,
    })
    this.evidentlyManager.createExperiment('test-experiment', this, {
      ...this.props.testEvidentlyExperiment,
      project: project.attrArn,
    })
    this.evidentlyManager.createSegment('test-segment', this, this.props.testEvidentlySegment)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestEvidentlyConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testEvidentlyProject')
    expect(commonStack.props.testEvidentlyProject.name).toEqual('test-project')
  })
})

describe('TestEvidentlyConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Evidently::Project', 1)
    template.resourceCountIs('AWS::Evidently::Feature', 1)
    template.resourceCountIs('AWS::Evidently::Launch', 1)
    template.resourceCountIs('AWS::Evidently::Experiment', 1)
    template.resourceCountIs('AWS::Evidently::Segment', 1)
  })
})

describe('TestEvidentlyConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testProjectProjectArn', {})
    template.hasOutput('testProjectProjectName', {})
    template.hasOutput('testFeatureFeatureArn', {})
    template.hasOutput('testFeatureFeatureName', {})
    template.hasOutput('testLaunchLaunchArn', {})
    template.hasOutput('testLaunchLaunchName', {})
    template.hasOutput('testExperimentExperimentArn', {})
    template.hasOutput('testExperimentExperimentName', {})
    template.hasOutput('testSegmentSegmentArn', {})
    template.hasOutput('testSegmentSegmentName', {})
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new proejct as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Project', {
      Name: 'test-project-test',
      DataDelivery: {
        LogGroup: 'test-logs',
      },
      Description: 'Test project test',
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new proejct as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Feature', {
      Name: 'isSomethingEnabled',
      Project: {
        'Fn::GetAtt': ['testcommonstacktestProjectB14CB69E', 'Arn'],
      },
      Variations: [
        {
          BooleanValue: false,
          VariationName: 'v1',
        },
        {
          BooleanValue: true,
          VariationName: 'v2',
        },
      ],
      DefaultVariation: 'v1',
      Description: 'Indicator for isSomethingEnabled as a flag',
      EvaluationStrategy: 'ALL_RULES',
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new proejct as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Launch', {
      Groups: [
        {
          Feature: 'isSomethingEnabled',
          GroupName: 'g1',
          Variation: 'v1',
        },
        {
          Feature: 'isSomethingEnabled',
          GroupName: 'g2',
          Variation: 'v2',
        },
      ],
      Name: 'test-launch-test',
      Project: {
        'Fn::GetAtt': ['testcommonstacktestProjectB14CB69E', 'Arn'],
      },
      ScheduledSplitsConfig: [
        {
          GroupWeights: [
            {
              GroupName: 'g1',
              SplitWeight: 50000,
            },
            {
              GroupName: 'g2',
              SplitWeight: 50000,
            },
          ],
          StartTime: '2025-11-25T23:59:59Z',
        },
      ],
      Description: 'Test launch test',
      ExecutionStatus: {
        Status: 'START',
      },
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new proejct as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Experiment', {
      MetricGoals: [
        {
          DesiredChange: 'INCREASE',
          EntityIdKey: 'dummy',
          MetricName: 'test-metric',
          ValueKey: 'testKey',
        },
      ],
      Name: 'test-experiment-test',
      OnlineAbConfig: {
        ControlTreatmentName: 'test-control-1',
        TreatmentWeights: [
          {
            SplitWeight: 25000,
            Treatment: 't1',
          },
          {
            SplitWeight: 25000,
            Treatment: 't2',
          },
          {
            SplitWeight: 50000,
            Treatment: 't3',
          },
        ],
      },
      Project: {
        'Fn::GetAtt': ['testcommonstacktestProjectB14CB69E', 'Arn'],
      },
      Treatments: [
        {
          Feature: 'isSomethingEnabled',
          TreatmentName: 't1',
          Variation: 'v1',
        },
        {
          Feature: 'isSomethingEnabled',
          TreatmentName: 't2',
          Variation: 'v1',
        },
        {
          Feature: 'isSomethingEnabled',
          TreatmentName: 't3',
          Variation: 'v2',
        },
      ],
      Description: 'Test experiment test',
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new proejct as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Segment', {
      Name: 'test-segment-test',
      Description: 'Test segment test',
    })
  })
})
