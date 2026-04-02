import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import {
  CommonConstruct,
  CommonStack,
  CommonStackProps,
  EvidentlyExperimentProps,
  EvidentlyFeatureProps,
  EvidentlyLaunchProps,
  EvidentlyProjectProps,
  EvidentlySegmentProps,
} from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testEvidentlyExperiment: EvidentlyExperimentProps
  testEvidentlyFeature: EvidentlyFeatureProps
  testEvidentlyLaunch: EvidentlyLaunchProps
  testEvidentlyProject: EvidentlyProjectProps
  testEvidentlySegment: EvidentlySegmentProps
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['packages/aws/test/common/cdkConfig/evidently.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
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
        testEvidentlyExperiment: this.node.tryGetContext('testEvidentlyExperiment'),
        testEvidentlyFeature: this.node.tryGetContext('testEvidentlyFeature'),
        testEvidentlyLaunch: this.node.tryGetContext('testEvidentlyLaunch'),
        testEvidentlyProject: this.node.tryGetContext('testEvidentlyProject'),
        testEvidentlySegment: this.node.tryGetContext('testEvidentlySegment'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
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
      DataDelivery: {
        LogGroup: 'test-logs',
      },
      Description: 'Test project test',
      Name: 'cdktest-test-project-test',
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new feature as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Feature', {
      DefaultVariation: 'v1',
      Description: 'Indicator for isSomethingEnabled as a flag',
      EvaluationStrategy: 'ALL_RULES',
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
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new launch as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Launch', {
      Description: 'Test launch test',
      ExecutionStatus: {
        Status: 'START',
      },
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
      Name: 'cdktest-test-launch-test',
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
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new experiment as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Experiment', {
      Description: 'Test experiment test',
      MetricGoals: [
        {
          DesiredChange: 'INCREASE',
          EntityIdKey: 'dummy',
          MetricName: 'test-metric',
          ValueKey: 'testKey',
        },
      ],
      Name: 'cdktest-test-experiment-test',
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
    })
  })
})

describe('TestEvidentlyConstruct', () => {
  test('provisions new segment as expected', () => {
    template.hasResourceProperties('AWS::Evidently::Segment', {
      Description: 'Test segment test',
      Name: 'cdktest-test-segment-test',
    })
  })
})

describe('TestEvidentlyConstructErrorHandling', () => {
  test('throws error when project props are undefined', () => {
    class TestErrorProjectStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorProjectConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorProjectConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createProject('test-project-err', this, undefined as any)
      }
    }

    const error = () => new TestErrorProjectStack(app, 'test-error-stack-project', testStackProps)
    expect(error).toThrow('EvidentlyProject props undefined')
  })

  test('throws error when project name is undefined', () => {
    class TestErrorProjectNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorProjectNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorProjectNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createProject('test-project-name-err', this, { description: 'test' } as any)
      }
    }

    const error = () => new TestErrorProjectNameStack(app, 'test-error-stack-project-name', testStackProps)
    expect(error).toThrow('EvidentlyProject name undefined')
  })

  test('throws error when feature props are undefined', () => {
    class TestErrorFeatureStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorFeatureConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorFeatureConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createFeature('test-feature-err', this, undefined as any)
      }
    }

    const error = () => new TestErrorFeatureStack(app, 'test-error-stack-feature', testStackProps)
    expect(error).toThrow('EvidentlyFeature props undefined')
  })

  test('throws error when launch props are undefined', () => {
    class TestErrorLaunchStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorLaunchConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorLaunchConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createLaunch('test-launch-err', this, undefined as any)
      }
    }

    const error = () => new TestErrorLaunchStack(app, 'test-error-stack-launch', testStackProps)
    expect(error).toThrow('EvidentlyLaunch props undefined')
  })

  test('throws error when launch name is undefined', () => {
    class TestErrorLaunchNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorLaunchNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorLaunchNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createLaunch('test-launch-name-err', this, { description: 'test', project: 'arn' } as any)
      }
    }

    const error = () => new TestErrorLaunchNameStack(app, 'test-error-stack-launch-name', testStackProps)
    expect(error).toThrow('EvidentlyLaunch name undefined')
  })

  test('throws error when experiment props are undefined', () => {
    class TestErrorExperimentStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorExperimentConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorExperimentConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createExperiment('test-experiment-err', this, undefined as any)
      }
    }

    const error = () => new TestErrorExperimentStack(app, 'test-error-stack-experiment', testStackProps)
    expect(error).toThrow('EvidentlyExperiment props undefined')
  })

  test('throws error when experiment name is undefined', () => {
    class TestErrorExperimentNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorExperimentNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorExperimentNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createExperiment('test-experiment-name-err', this, {
          description: 'test',
          project: 'arn',
        } as any)
      }
    }

    const error = () => new TestErrorExperimentNameStack(app, 'test-error-stack-experiment-name', testStackProps)
    expect(error).toThrow('EvidentlyExperiment name undefined')
  })

  test('throws error when segment props are undefined', () => {
    class TestErrorSegmentStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorSegmentConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorSegmentConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createSegment('test-segment-err', this, undefined as any)
      }
    }

    const error = () => new TestErrorSegmentStack(app, 'test-error-stack-segment', testStackProps)
    expect(error).toThrow('EvidentlySegment props undefined')
  })

  test('throws error when segment name is undefined', () => {
    class TestErrorSegmentNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorSegmentNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorSegmentNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.evidentlyManager.createSegment('test-segment-name-err', this, { description: 'test' } as any)
      }
    }

    const error = () => new TestErrorSegmentNameStack(app, 'test-error-stack-segment-name', testStackProps)
    expect(error).toThrow('EvidentlySegment name undefined')
  })
})
