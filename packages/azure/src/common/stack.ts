import fs, { readFileSync, statSync } from 'fs'
import path, { dirname, join } from 'path'

import { isDevStage } from '@gradientedge/cdk-utils-common'
import { ComponentResource, ComponentResourceOptions, Config } from '@pulumi/pulumi'
import appRoot from 'app-root-path'
import _ from 'lodash'

import { CommonAzureConstruct } from './construct.js'
import { registerTagTransformation } from './tagging.js'
import { CommonAzureStackProps } from './types.js'

/**
 * Common stack to use as a base for all higher level constructs using Pulumi
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
 * @category Common
 */
export class CommonAzureStack extends ComponentResource {
  /** Default Node.js runtime version for Azure Function Apps */
  public static NODEJS_RUNTIME = '24'

  /** The construct instance created by this stack */
  construct: CommonAzureConstruct
  /** Stack properties including environment-specific configuration */
  props: CommonAzureStackProps
  /** Pulumi config instance for reading stack configuration values */
  config: Config
  /** Registered stack outputs for cross-stack references */
  outputs?: Record<string, unknown>

  /**
   * @summary Create a new CommonAzureStack
   * @param name the scoped name of the stack
   * @param props the common Azure stack properties
   * @param options optional Pulumi component resource options
   */
  constructor(name: string, props: CommonAzureStackProps, options?: ComponentResourceOptions) {
    super(`stack:${name}`, name, props, options)

    /* initialise config */
    this.config = new Config()
    this.props = this.determineConstructProps(props)

    /* register tag transformation for automatic tag application */
    if (this.props.defaultTags) {
      registerTagTransformation(this.props.defaultTags, this.props.tagsToIgnore ?? [])
    }

    this.createConstruct()
    this.registerOutputs()
  }

  /**
   * @summary Method to determine the core construct properties injected via context
   * @param props The stack properties
   * @returns The stack properties
   */
  protected determineConstructProps(props: CommonAzureStackProps) {
    return _.merge(
      {},
      props,
      {
        extraContexts: this.config.getObject('extraContexts'),
        regionContextPath: this.config.get('regionContextPath'),
        stage: process.env.STAGE ?? this.config.get('stage'),
        stageContextPath: this.config.get('stageContextPath'),
        stageRegionContextPath: this.config.get('stageRegionContextPath'),
      },
      this.determineExtraContexts(),
      this.determineRegionContexts(),
      this.determineStageContexts(),
      this.determineStageRegionContexts()
    )
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
      if (!fs.existsSync(extraContextPath))
        throw new Error(`Extra context properties unavailable in path:${extraContextPath}`)

      /* read the extra properties */
      const extraContextPropsBuffer = fs.readFileSync(extraContextPath)
      if (debug) console.debug(`Adding additional contexts provided in ${extraContextPath}`)

      /* parse as JSON properties */
      extraContextProps = _.merge(extraContextProps, JSON.parse(extraContextPropsBuffer.toString('utf-8')))
    })
    return extraContextProps
  }

  /**
   * @summary Method to determine region contexts apart from the main context
   * - Location is resolved from `location` Pulumi config
   * - Loads `{regionContextPath}/{location}.json` if present
   * - Primary use is to have layered config for each region in separate files
   */
  protected determineRegionContexts() {
    const debug = this.config.getBoolean('debug')
    const location = this.config.get('location')
    const regionContextPath = this.config.get('regionContextPath')
    if (!location || !regionContextPath) {
      if (debug) console.debug(`No region context provided. Using default context properties`)
      return {}
    }

    const regionContextFilePath = path.join(appRoot.path, regionContextPath, `${location}.json`)

    /* alert default context usage when region config is missing */
    if (!fs.existsSync(regionContextFilePath)) {
      if (debug) console.debug(`Region context properties unavailable in path:${regionContextFilePath}`)
      if (debug) console.debug(`Using default context properties for ${location} location`)
      return {}
    }

    /* read the region properties */
    const regionContextPropsBuffer = fs.readFileSync(regionContextFilePath)
    if (debug) console.debug(`Adding region contexts provided in ${regionContextFilePath}`)

    /* parse as JSON properties */
    return JSON.parse(regionContextPropsBuffer.toString('utf-8'))
  }

  /**
   * @summary Method to determine extra stage contexts apart from the main context
   * - Sets the properties from the extra stage contexts
   * - Primary use is to have layered config for each environment which is injected into the context
   */
  protected determineStageContexts() {
    const debug = this.config.getBoolean('debug')
    const stage = process.env.STAGE ?? this.config.get('stage')
    const stageContextPath = this.config.get('stageContextPath')
    const stageContextFilePath = path.join(appRoot.path, stageContextPath ?? 'env', `${stage}.json`)

    if (stage && isDevStage(stage)) {
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
   * @summary Method to determine stage-region contexts for environment and region-specific overrides
   * - Loads `{stageRegionContextPath}/{stage}.{location}.json` if present
   * - Has the highest priority in the configuration hierarchy
   * - Primary use is to override config for a specific stage+region combination (e.g., prd.uksouth.json)
   */
  protected determineStageRegionContexts() {
    const debug = this.config.getBoolean('debug')
    const stage = process.env.STAGE ?? this.config.get('stage')
    const location = this.config.get('location') ?? process.env.LOCATION
    const stageRegionContextPath = this.config.get('stageRegionContextPath')
    if (!stage || !location || !stageRegionContextPath) {
      if (debug) console.debug(`No stage-region context provided. Using default context properties`)
      return {}
    }

    const stageRegionContextFilePath = path.join(appRoot.path, stageRegionContextPath, `${stage}.${location}.json`)

    /* gracefully skip when stage-region config is missing */
    if (!fs.existsSync(stageRegionContextFilePath)) {
      if (debug) console.debug(`Stage-region context properties unavailable in path:${stageRegionContextFilePath}`)
      return {}
    }

    /* read the stage-region properties */
    const stageRegionContextPropsBuffer = fs.readFileSync(stageRegionContextFilePath)
    if (debug) console.debug(`Adding stage-region contexts provided in ${stageRegionContextFilePath}`)

    /* parse as JSON properties */
    return JSON.parse(stageRegionContextPropsBuffer.toString('utf-8'))
  }

  /**
   * @summary Create the construct instance for this stack
   * - Override in subclasses to provision infrastructure resources
   */
  protected createConstruct() {}

  /**
   * @summary Register stack outputs for cross-stack consumption
   * - Registers resource group id and name if a construct with a resource group exists
   */
  protected registerOutputs() {
    if (this.construct && this.construct.resourceGroup) {
      this.outputs = _.merge(this.outputs, {
        resourceGroupId: this.construct.resourceGroup.id,
        resourceGroupName: this.construct.resourceGroup.name,
      })
      super.registerOutputs(this.outputs)
    }
  }

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  protected fullyQualifiedDomain() {
    const domainName = this.props.domainName
    const subDomain = this.props.subDomain

    return subDomain ? `${subDomain}.${domainName}` : domainName
  }

  /**
   * @summary Walk up the directory tree to locate the infrastructure root containing the stage context path
   * @returns The directory path containing the stage context configuration
   * @throws Error if the stage context directory cannot be found within 6 parent directories
   */
  protected static determineEnvironmentProperty() {
    const config = new Config()
    const stageContextPath = config.get('stageContextPath')
    let dir = process.cwd()
    for (let i = 0; i < 6; i++) {
      try {
        if (statSync(join(dir, `${stageContextPath}`)).isDirectory()) return dir
      } catch {
        /* keep walking */
      }
      dir = dirname(dir)
    }
    throw new Error('Could not locate infrastructure root (pulumi-env/ not found)')
  }

  /**
   * @summary Retrieve a specific property from the stage-specific environment configuration file
   * @param property the property key to retrieve from the environment config
   * @returns The value of the requested property from the stage config JSON
   */
  protected static getEnvironmentProperty(property: string) {
    const config = new Config()
    const stage = config.get('stage')
    const stageContextPath = config.get('stageContextPath')
    const envConfig = JSON.parse(
      readFileSync(join(this.determineEnvironmentProperty(), `${stageContextPath}`, `${stage}.json`), 'utf8')
    )
    return envConfig[property]
  }
}
