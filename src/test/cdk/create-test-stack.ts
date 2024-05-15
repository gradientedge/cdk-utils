import { Template } from 'aws-cdk-lib/assertions'
import { App, AppProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CommonStack, CommonConstruct, CommonStackProps } from '../../lib'

/**
 * Method prepares a construct for testing by wrapping the construct in a stack
 * and initialising the resources if the construct has an initResources method.
 *
 * @param app - The CDK app
 * @param Construct - The construct to create
 * @param id - The ID of the stack
 * @param stackProps - The stack properties
 */
function createTestStack<P extends CommonStackProps, T extends CommonConstruct<P>>(
  app: App,
  Construct: new (parent: Construct, id: string, props: P) => T,
  id: string,
  stackProps: P
): CommonStack {
  class InitTestCommonStack extends CommonStack {
    constructor(parent: App, id: string, props: P) {
      super(parent, id, props)

      this.construct = new Construct(this, id, { ...this.props, ...props })
      // ideally this would be part of construct interface
      if ('initResources' in this.construct && typeof this.construct.initResources === 'function') {
        this.construct.initResources()
      }
    }
  }

  return new InitTestCommonStack(app, id, stackProps)
}

/**
 * Method to create an app with a stack and a template
 *
 * @param context - The CDK context
 * @param props - The stack and construct properties (we have to separate both)
 * @param stackName - The name of the stack
 * @param Construct - The construct to create
 */
const createApp = <T extends AppProps, P extends CommonStackProps, C extends CommonConstruct<P>>({
  context,
  props,
  stackName,
  Construct,
}: {
  context: T
  props: P
  stackName: string
  Construct: new (parent: Construct, id: string, props: P) => C
}) => {
  const app = new App({ context })
  const stack = createTestStack(app, Construct, stackName, props)

  const template = Template.fromStack(stack)
  return { stack, template }
}

export { createApp }
export { createTestStack }
