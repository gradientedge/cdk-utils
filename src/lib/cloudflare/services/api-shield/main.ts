import { ApiShieldOperationSchemaValidationSettings } from '@cdktf/provider-cloudflare/lib/api-shield-operation-schema-validation-settings/index.js'
import { ApiShieldOperation } from '@cdktf/provider-cloudflare/lib/api-shield-operation/index.js'
import { ApiShieldSchemaValidationSettings } from '@cdktf/provider-cloudflare/lib/api-shield-schema-validation-settings/index.js'
import { ApiShieldSchema } from '@cdktf/provider-cloudflare/lib/api-shield-schema/index.js'
import { ApiShield } from '@cdktf/provider-cloudflare/lib/api-shield/index.js'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { createCloudflareTfOutput } from '../../utils/index.js'
import {
  ApiShieldOperationProps,
  ApiShieldOperationSchemaValidationSettingsProps,
  ApiShieldProps,
  ApiShieldSchemaProps,
  ApiShieldSchemaValidationSettingsProps,
} from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Api Shield
 * - A new instance of this class is injected into {@link CommonCloudflareConstruct} constructor.
 * - If a custom construct extends {@link CommonCloudflareConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct, CommonCloudflareConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(parent: Construct, id: string, props: CommonCloudflareStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.apiShieldManager.createApiShield('MyApiShield', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareApiShieldManager {
  /**
   * @summary Method to create a new Cloudflare Api Shield
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield properties
   * @see [CDKTF API Shield Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/apiShield.typescript.md}
   */
  public createApiShield(id: string, scope: CommonCloudflareConstruct, props: ApiShieldProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const apiShield = new ApiShield(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-apiShieldFriendlyUniqueId`, scope, apiShield.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-apiShieldId`, scope, apiShield.id)

    return apiShield
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Schema
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield schema properties
   * @see [CDKTF API Shield Schema Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/apiShieldSchema.typescript.md}
   */
  public createApiShieldSchema(id: string, scope: CommonCloudflareConstruct, props: ApiShieldSchemaProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const apiShieldSchema = new ApiShieldSchema(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-apiShieldSchemaFriendlyUniqueId`, scope, apiShieldSchema.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-apiShieldSchemaId`, scope, apiShieldSchema.schemaId)

    return apiShieldSchema
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Schema Validation Settings
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield schema validation settings properties
   * @see [CDKTF API Shield Schema Validation Settings Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/apiShieldSchema.typescript.md}
   */
  public createApiShieldSchemaValidationSettings(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ApiShieldSchemaValidationSettingsProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const apiShieldSchemaValidationSettings = new ApiShieldSchemaValidationSettings(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(
      `${id}-apiShieldSchemaValidationSettingsFriendlyUniqueId`,
      scope,
      apiShieldSchemaValidationSettings.friendlyUniqueId
    )
    createCloudflareTfOutput(`${id}-apiShieldSchemaValidationSettingsId`, scope, apiShieldSchemaValidationSettings.id)

    return apiShieldSchemaValidationSettings
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Operation
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield operation properties
   * @see [CDKTF API Shield Operation Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/apiShieldOperation.typescript.md}
   */
  public createApiShieldOperation(id: string, scope: CommonCloudflareConstruct, props: ApiShieldOperationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const apiShieldOperation = new ApiShieldOperation(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-apiShieldOperationFriendlyUniqueId`, scope, apiShieldOperation.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-apiShieldOperationId`, scope, apiShieldOperation.id)

    return apiShieldOperation
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Operation Schema Validation Settings
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield operation schema validation settings properties
   * @see [CDKTF API Shield Operation Schema Validation Settings Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/apiShieldOperationSchemaValidationSettings.typescript.md}
   */
  public createApiShieldOperationSchemaValidationSettings(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ApiShieldOperationSchemaValidationSettingsProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const apiShieldOperationSchemaValidationSettings = new ApiShieldOperationSchemaValidationSettings(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(
      `${id}-apiShieldOperationSchemaValidationSettingsFriendlyUniqueId`,
      scope,
      apiShieldOperationSchemaValidationSettings.friendlyUniqueId
    )
    createCloudflareTfOutput(
      `${id}-apiShieldOperationSchemaValidationSettingsId`,
      scope,
      apiShieldOperationSchemaValidationSettings.id
    )

    return apiShieldOperationSchemaValidationSettings
  }
}
