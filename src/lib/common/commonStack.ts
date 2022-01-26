import * as cdk from 'aws-cdk-lib'
import { CommonStackProps } from '../types'
import { isDevStage } from '../utils'
import { CommonConstruct } from './commonConstruct'

const appRoot = require('app-root-path')
const fs = require('fs')

/**
 * @stability stable
 * @category Stacks
 * @summary Common stack to use as a base for all higher level constructs.
 *
 * @example
 * import { CommonStack } from '@gradientedge/cdk-utils'
 *
 * class CustomStack extends CommonStack {
 *   constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
 *     super(parent, name, props)
 *     // provision resources
 *   }
 * }
 *
 * @mermaid
 *   graph LR;
 *     A[CommonStack]-.->|extends|B(cdk.Stack);
 *     B(cdk.Stack)-->|implements|C(cdk.ITaggable);
 */
export class CommonStack extends cdk.Stack {
  construct: CommonConstruct
  props: CommonStackProps
  /**
   * @summary Constructor to initialise the CommonStack
   * @param {cdk.App} parent
   * @param {string} name
   * @param {cdk.StackProps} props
   */
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    /* determine extra cdk contexts */
    this.determineExtraContexts()

    /* determine extra cdk stage contexts */
    this.determineStageContexts()

    this.props = this.determineConstructProps(props)

    /* initialise the construct */
    this.construct = new CommonConstruct(this, 'cdk-utils', this.props)
  }

  /**
   * @summary Method to determine the core CDK construct properties injected via context cdk.json
   * @param {cdk.StackProps} props The stack properties
   * @return The stack properties
   */
  protected determineConstructProps(props: cdk.StackProps) {
    return {
      stackName: props.stackName,
      name: props.stackName || 'cdk-utils',
      region: this.node.tryGetContext('region'),
      stage: this.node.tryGetContext('stage'),
      domainName: this.node.tryGetContext('domainName'),
      subDomain: this.node.tryGetContext('subDomain'),
      extraContexts: this.node.tryGetContext('extraContexts'),
    }
  }

  /**
   * @summary Method to determine extra cdk contexts apart from the main cdk.json
   * - Sets the properties from the extra contexts into cdk node context
   * - Primary use is to have layered config in separate files to enable easier maintenance and readability
   */
  protected determineExtraContexts() {
    const extraContexts = this.node.tryGetContext('extraContexts')

    if (!extraContexts) {
      console.info(`No additional contexts provided. Using default context properties from cdk.json`)
      return
    }

    extraContexts.forEach((context: string) => {
      const extraContextPath = `${appRoot.path}/${context}`

      /* scenario where extra context is configured in cdk.json but absent in file system */
      if (!fs.existsSync(extraContextPath)) throw `Extra context properties unavailable in path:${extraContextPath}`

      /* read the extra properties */
      const extraContextPropsBuffer = fs.readFileSync(extraContextPath)
      console.info(`Adding additional contexts provided in ${extraContextPath}`)

      /* parse as JSON properties */
      const extraContextProps = JSON.parse(extraContextPropsBuffer)

      /* set each of the property into the cdk node context */
      Object.keys(extraContextProps).forEach((propKey: any) => {
        this.node.setContext(propKey, extraContextProps[propKey])
      })
    })
  }

  /**
   * @summary Method to determine extra cdk stage contexts apart from the main cdk.json
   * - Sets the properties from the extra stage contexts into cdk node context
   * - Primary use is to have layered config for each environment which is injected into the context
   */
  protected determineStageContexts() {
    const stage = this.node.tryGetContext('stage')
    const stageContextPath = this.node.tryGetContext('stageContextPath') || 'cdkEnv'
    const stageContextFilePath = `${appRoot.path}/${stageContextPath}/${stage}.json`

    if (isDevStage(stage)) {
      console.info(`Development stage. Using default stage context properties`)
    }

    /* alert default context usage when extra stage config is missing */
    if (!fs.existsSync(stageContextFilePath)) {
      console.info(`Stage specific context properties unavailable in path:${stageContextFilePath}`)
      console.info(`Using default stage context properties for ${stage} stage`)
      return
    }

    /* read the extra properties */
    const stageContextPropsBuffer = fs.readFileSync(stageContextFilePath)
    console.info(`Adding additional stage contexts provided in ${stageContextFilePath}`)

    /* parse as JSON properties */
    const stageContextProps = JSON.parse(stageContextPropsBuffer)

    /* set each of the property into the cdk node context */
    Object.keys(stageContextProps).forEach((propKey: any) => {
      /* handle object, array properties */
      if (typeof stageContextProps[propKey] === 'object' && !Array.isArray(stageContextProps[propKey])) {
        this.node.setContext(propKey, {
          ...this.node.tryGetContext(propKey),
          ...stageContextProps[propKey],
        })
      } else {
        /* handle all other primitive properties */
        this.node.setContext(propKey, stageContextProps[propKey])
      }
    })
  }

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  protected fullyQualifiedDomain() {
    const domainName = this.node.tryGetContext('domainName')
    const subDomain = this.node.tryGetContext('subDomain')
    return subDomain ? `${subDomain}.${domainName}` : domainName
  }
}
