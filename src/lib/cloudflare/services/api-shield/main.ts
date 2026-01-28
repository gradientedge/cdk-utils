import * as cloudflare from '@pulumi/cloudflare'
import { CommonCloudflareConstruct } from '../../common/index.js'
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
   * @see [Pulumi API Shield]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishield/}
   */
  public createApiShield(id: string, scope: CommonCloudflareConstruct, props: ApiShieldProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.ApiShield(`${id}`, {
      ...props,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Schema
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield schema properties
   * @see [Pulumi API Shield Schema]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldschema/}
   */
  public createApiShieldSchema(id: string, scope: CommonCloudflareConstruct, props: ApiShieldSchemaProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.ApiShieldSchema(`${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Schema Validation Settings
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield schema validation settings properties
   * @see [Pulumi API Shield Schema Validation Settings]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldschemavalidationsettings/}
   */
  public createApiShieldSchemaValidationSettings(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ApiShieldSchemaValidationSettingsProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.ApiShieldSchemaValidationSettings(`${id}`, {
      ...props,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Operation
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield operation properties
   * @see [Pulumi API Shield Operation]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldoperation/}
   */
  public createApiShieldOperation(id: string, scope: CommonCloudflareConstruct, props: ApiShieldOperationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.ApiShieldOperation(`${id}`, {
      ...props,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Api Shield Operation Schema Validation Settings
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api shield operation schema validation settings properties
   * @see [Pulumi API Shield Operation Schema Validation Settings]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldoperationschemavalidationsettings/}
   */
  public createApiShieldOperationSchemaValidationSettings(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ApiShieldOperationSchemaValidationSettingsProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.ApiShieldOperationSchemaValidationSettings(`${id}`, {
      ...props,
      zoneId,
    })
  }
}
