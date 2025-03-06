import fs from 'fs'
import { CommonAzureConstruct } from './construct'
import { CommonAzureStackProps } from './types'

import appRoot from 'app-root-path'
import { TerraformStack } from 'cdktf'
import { Construct } from 'constructs'
import _ from 'lodash'
import { isDevStage } from '../../common'
import path from 'path'

/**
 * @classdesc Common stack to use as a base for all higher level constructs.
 * @example
 * import { CommonAzureStack } from '@gradientedge/cdk-utils'
 *
 * class CustomStack extends CommonAzureStack {
 *   constructor(parent: App, name: string, props: StackProps) {
 *     super(parent, name, props)
 *     // provision resources
 *   }
 * }
 */
export class CommonAzureStack extends TerraformStack {
  construct: CommonAzureConstruct
  props: CommonAzureStackProps

  constructor(parent: Construct, name: string, props: CommonAzureStackProps) {
    super(parent, name)

    /* determine extra cdk contexts */
    this.determineExtraContexts()

    /* determine extra cdk stage contexts */
    this.determineStageContexts()

    this.props = this.determineConstructProps(props)
  }

  /**
   * @summary Method to determine the core CDK construct properties injected via context cdktf.json
   * @param props The stack properties
   * @returns The stack properties
   */
  protected determineConstructProps(props: CommonAzureStackProps) {
    return {
      domainName: this.node.tryGetContext('domainName'),
      extraContexts: this.node.tryGetContext('extraContexts'),
      features: this.node.tryGetContext('features'),
      location: this.node.tryGetContext('location'),
      name: this.node.tryGetContext('resourceGroupName'),
      resourceGroupName: this.node.tryGetContext('resourceGroupName'),
      globalPrefix: this.node.tryGetContext('globalPrefix'),
      globalSuffix: this.node.tryGetContext('globalSuffix'),
      resourceNameOptions: this.node.tryGetContext('resourceNameOptions'),
      resourcePrefix: this.node.tryGetContext('resourcePrefix'),
      resourceSuffix: this.node.tryGetContext('resourceSuffix'),
      skipStageForARecords: this.node.tryGetContext('skipStageForARecords'),
      stage: this.node.tryGetContext('stage'),
      subDomain: this.node.tryGetContext('subDomain'),
      subscriptionId: this.node.tryGetContext('subscriptionId'),
    }
  }

  /**
   * @summary Method to determine extra cdk contexts apart from the main cdktf.json
   * - Sets the properties from the extra contexts into cdk node context
   * - Primary use is to have layered config in separate files to enable easier maintenance and readability
   */
  protected determineExtraContexts() {
    const extraContexts = this.node.tryGetContext('extraContexts')
    const debug = this.node.tryGetContext('debug')

    if (!extraContexts) {
      if (debug) console.debug(`No additional contexts provided. Using default context properties from cdktf.json`)
      return
    }

    _.forEach(extraContexts, (context: string) => {
      const extraContextPath = path.join(appRoot.path, context)

      /* scenario where extra context is configured in cdk.json but absent in file system */
      if (!fs.existsSync(extraContextPath)) throw `Extra context properties unavailable in path:${extraContextPath}`

      /* read the extra properties */
      const extraContextPropsBuffer = fs.readFileSync(extraContextPath)
      if (debug) console.debug(`Adding additional contexts provided in ${extraContextPath}`)

      /* parse as JSON properties */
      const extraContextProps = JSON.parse(extraContextPropsBuffer.toString('utf-8'))

      /* set each of the property into the cdk node context */
      _.keys(extraContextProps).forEach((propKey: any) => {
        this.node.setContext(propKey, extraContextProps[propKey])
      })
    })
  }

  /**
   * @summary Method to determine extra cdk stage contexts apart from the main cdktf.json
   * - Sets the properties from the extra stage contexts into cdk node context
   * - Primary use is to have layered config for each environment which is injected into the context
   */
  protected determineStageContexts() {
    const stage = this.node.tryGetContext('stage')
    const stageContextPath = this.node.tryGetContext('stageContextPath') || 'cdkEnv'
    const stageContextFilePath = path.join(appRoot.path, stageContextPath, `${stage}.json`)
    const debug = this.node.tryGetContext('debug')

    if (isDevStage(stage)) {
      if (debug) console.debug(`Development stage. Using default stage context properties`)
    }

    /* alert default context usage when extra stage config is missing */
    if (!fs.existsSync(stageContextFilePath)) {
      if (debug) console.debug(`Stage specific context properties unavailable in path:${stageContextFilePath}`)
      if (debug) console.debug(`Using default stage context properties for ${stage} stage`)
      return
    }

    /* read the extra properties */
    const stageContextPropsBuffer = fs.readFileSync(stageContextFilePath)
    if (debug) console.debug(`Adding additional stage contexts provided in ${stageContextFilePath}`)

    /* parse as JSON properties */
    const stageContextProps = JSON.parse(stageContextPropsBuffer.toString('utf-8'))

    /* set each of the property into the cdk node context */
    _.keys(stageContextProps).forEach((propKey: any) => {
      /* handle object, array properties */
      if (typeof stageContextProps[propKey] === 'object' && !Array.isArray(stageContextProps[propKey])) {
        this.node.setContext(propKey, _.merge(this.node.tryGetContext(propKey), stageContextProps[propKey]))
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
