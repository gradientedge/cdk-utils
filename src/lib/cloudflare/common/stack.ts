import { ComponentResource, ComponentResourceOptions, Config } from '@pulumi/pulumi'
import appRoot from 'app-root-path'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { isDevStage } from '../../common/index.js'
import { CommonCloudflareConstruct } from './construct.js'
import { CommonCloudflareStackProps } from './types.js'

/**
 * @classdesc Common stack to use as a base for all higher level constructs.
 * @example
 * import { CommonCloudflareStack } from '@gradientedge/cdk-utils'
 *
 * class CustomStack extends CommonCloudflareStack {
 *   constructor(parent: App, name: string, props: StackProps) {
 *     super(parent, name, props)
 *     // provision resources
 *   }
 * }
 */
export class CommonCloudflareStack extends ComponentResource {
  construct: CommonCloudflareConstruct
  props: CommonCloudflareStackProps
  config: Config

  constructor(name: string, props: CommonCloudflareStackProps, options?: ComponentResourceOptions) {
    super(`custom:cloudflare:Stack:${name}`, name, props, options)

    /* initialise config */
    this.config = new Config()
    this.props = this.determineConstructProps(props)
  }

  /**
   * @summary Method to determine the core CDK construct properties injected via context
   * @param props The stack properties
   * @returns The stack properties
   */
  protected determineConstructProps(props: CommonCloudflareStackProps) {
    let projectProps: CommonCloudflareStackProps = props
    if (!projectProps) {
      const projectPropsPath = path.join(appRoot.path, 'pulumi.json')
      if (!fs.existsSync(projectPropsPath)) throw `Context properties unavailable in path:${projectPropsPath}`

      const projectPropsBuffer = fs.readFileSync(projectPropsPath)
      projectProps = JSON.parse(projectPropsBuffer.toString('utf-8'))
    }

    return {
      accountId: projectProps.accountId,
      apiToken: projectProps.apiToken,
      domainName: projectProps.domainName,
      extraContexts: projectProps.extraContexts,
      name: projectProps.resourceGroupName ?? projectProps.name,
      skipStageForARecords: projectProps.skipStageForARecords,
      stage: projectProps.stage,
      stageContextPath: projectProps.stageContextPath,
      subDomain: projectProps.subDomain,
      ...this.determineExtraContexts(props),
      ...this.determineStageContexts(props),
    }
  }

  /**
   * @summary Method to determine extra cdk contexts apart from the main context
   * - Sets the properties from the extra contexts into cdk node context
   * - Primary use is to have layered config in separate files to enable easier maintenance and readability
   */
  protected determineExtraContexts(props: CommonCloudflareStackProps) {
    if (!props.extraContexts) {
      if (props.debug) console.debug(`No additional contexts provided. Using default context properties`)
      return {}
    }

    let extraContextProps: Record<string, any> = {}
    _.forEach(props.extraContexts, (context: string) => {
      const extraContextPath = path.join(appRoot.path, context)

      /* scenario where extra context is configured in cdk.json but absent in file system */
      if (!fs.existsSync(extraContextPath)) throw `Extra context properties unavailable in path:${extraContextPath}`

      /* read the extra properties */
      const extraContextPropsBuffer = fs.readFileSync(extraContextPath)
      if (props.debug) console.debug(`Adding additional contexts provided in ${extraContextPath}`)

      /* parse as JSON properties */
      extraContextProps = {
        ...extraContextProps,
        ...JSON.parse(extraContextPropsBuffer.toString('utf-8')),
      }
    })
    return extraContextProps
  }

  /**
   * @summary Method to determine extra cdk stage contexts apart from the main context
   * - Sets the properties from the extra stage contexts into cdk node context
   * - Primary use is to have layered config for each environment which is injected into the context
   */
  protected determineStageContexts(props: CommonCloudflareStackProps) {
    const stageContextFilePath = path.join(appRoot.path, props.stageContextPath ?? 'env', `${props.stage}.json`)

    if (isDevStage(props.stage)) {
      if (props.debug) console.debug(`Development stage. Using default stage context properties`)
    }

    /* alert default context usage when extra stage config is missing */
    if (!fs.existsSync(stageContextFilePath)) {
      if (props.debug) console.debug(`Stage specific context properties unavailable in path:${stageContextFilePath}`)
      if (props.debug) console.debug(`Using default stage context properties for ${props.stage} stage`)
      return {}
    }

    /* read the extra properties */
    const stageContextPropsBuffer = fs.readFileSync(stageContextFilePath)
    if (props.debug) console.debug(`Adding additional stage contexts provided in ${stageContextFilePath}`)

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
