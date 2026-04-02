import fs from 'fs'
import path from 'path'

import { ComponentResource, ComponentResourceOptions, Config } from '@pulumi/pulumi'
import appRoot from 'app-root-path'
import _ from 'lodash'
import { isDevStage } from '@gradientedge/cdk-utils-common'

import { CommonAzureConstruct } from './construct.js'
import { registerTagTransformation } from './tagging.js'
import { CommonAzureStackProps } from './types.js'

/**
 * @classdesc Common stack to use as a base for all higher level constructs using Pulumi
 * @example
 * ```typescript
 * import { CommonAzureStack } from '@gradientedge/cdk-utils'
 *
 * class CustomStack extends CommonAzureStack {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     // provision resources
 *   }
 * }
 * ```
 */
export class CommonAzureStack extends ComponentResource {
  public static NODEJS_RUNTIME = '22'

  construct: CommonAzureConstruct
  props: CommonAzureStackProps
  config: Config

  constructor(name: string, props: CommonAzureStackProps, options?: ComponentResourceOptions) {
    super(`custom:azure:Stack:${name}`, name, props, options)

    /* initialise config */
    this.config = new Config()
    this.props = this.determineConstructProps(props)

    /* register tag transformation for automatic tag application */
    if (this.props.defaultTags) {
      registerTagTransformation(this.props.defaultTags)
    }
  }

  /**
   * @summary Method to determine the core construct properties injected via context
   * @param props The stack properties
   * @returns The stack properties
   */
  protected determineConstructProps(props: CommonAzureStackProps) {
    return {
      ...props,
      extraContexts: this.config.getObject('extraContexts'),
      stage: this.config.require('stage'),
      stageContextPath: this.config.require('stageContextPath'),
      ...this.determineExtraContexts(),
      ...this.determineStageContexts(),
    }
  }

  /**
   * @summary Method to determine extra contexts apart from the main context
   * - Sets the properties from the extra contexts
   * - Primary use is to have layered config in separate files to enable easier maintenance and readability
   */
  protected determineExtraContexts() {
    const extraContexts = this.config.getObject('extraContexts')
    const debug = this.config.getBoolean('debug')
    if (!extraContexts) {
      if (debug) console.debug(`No additional contexts provided. Using default context properties`)
      return {}
    }

    let extraContextProps: Record<string, any> = {}
    _.forEach(extraContexts, (context: string) => {
      const extraContextPath = path.join(appRoot.path, context)

      /* scenario where extra context is configured but absent in file system */
      if (!fs.existsSync(extraContextPath)) throw `Extra context properties unavailable in path:${extraContextPath}`

      /* read the extra properties */
      const extraContextPropsBuffer = fs.readFileSync(extraContextPath)
      if (debug) console.debug(`Adding additional contexts provided in ${extraContextPath}`)

      /* parse as JSON properties */
      extraContextProps = {
        ...extraContextProps,
        ...JSON.parse(extraContextPropsBuffer.toString('utf-8')),
      }
    })
    return extraContextProps
  }

  /**
   * @summary Method to determine extra stage contexts apart from the main context
   * - Sets the properties from the extra stage contexts
   * - Primary use is to have layered config for each environment which is injected into the context
   */
  protected determineStageContexts() {
    const debug = this.config.getBoolean('debug')
    const stage = this.config.require('stage')
    const stageContextPath = this.config.get('stageContextPath')
    const stageContextFilePath = path.join(appRoot.path, stageContextPath ?? 'env', `${stage}.json`)

    if (isDevStage(stage)) {
      if (debug) console.debug(`Development stage. Using default stage context properties`)
    }

    /* alert default context usage when extra stage config is missing */
    if (!fs.existsSync(stageContextFilePath)) {
      if (debug) console.debug(`Stage specific context properties unavailable in path:${stageContextFilePath}`)
      if (debug) console.debug(`Using default stage context properties for ${stage} stage`)
      return {}
    }

    /* read the extra properties */
    const stageContextPropsBuffer = fs.readFileSync(stageContextFilePath)
    if (debug) console.debug(`Adding additional stage contexts provided in ${stageContextFilePath}`)

    /* parse as JSON properties */
    return JSON.parse(stageContextPropsBuffer.toString('utf-8'))
  }

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  protected fullyQualifiedDomain() {
    const domainName = this.props.domainName
    const subDomain = this.props.subDomain

    return subDomain ? `${subDomain}.${domainName}` : domainName
  }
}
