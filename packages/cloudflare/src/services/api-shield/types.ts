import {
  ApiShieldArgs,
  ApiShieldOperationArgs,
  ApiShieldOperationSchemaValidationSettingsArgs,
  ApiShieldSchemaArgs,
  ApiShieldSchemaValidationSettingsArgs,
} from '@pulumi/cloudflare'

/**
 * Properties for creating a Cloudflare API Shield
 * @see [Pulumi Cloudflare ApiShield]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishield/}
 * @category Interface
 */
export interface ApiShieldProps extends ApiShieldArgs {}
/**
 * Properties for creating a Cloudflare API Shield Schema
 * @see [Pulumi Cloudflare ApiShieldSchema]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldschema/}
 * @category Interface
 */
export interface ApiShieldSchemaProps extends ApiShieldSchemaArgs {}
/**
 * Properties for creating Cloudflare API Shield Schema Validation Settings
 * @see [Pulumi Cloudflare ApiShieldSchemaValidationSettings]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldschemavalidationsettings/}
 * @category Interface
 */
export interface ApiShieldSchemaValidationSettingsProps extends ApiShieldSchemaValidationSettingsArgs {}
/**
 * Properties for creating a Cloudflare API Shield Operation
 * @see [Pulumi Cloudflare ApiShieldOperation]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldoperation/}
 * @category Interface
 */
export interface ApiShieldOperationProps extends ApiShieldOperationArgs {}
/**
 * Properties for creating Cloudflare API Shield Operation Schema Validation Settings
 * @see [Pulumi Cloudflare ApiShieldOperationSchemaValidationSettings]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/apishieldoperationschemavalidationsettings/}
 * @category Interface
 */
export interface ApiShieldOperationSchemaValidationSettingsProps extends ApiShieldOperationSchemaValidationSettingsArgs {}
