import {
  ApiShieldArgs,
  ApiShieldOperationArgs,
  ApiShieldOperationSchemaValidationSettingsArgs,
  ApiShieldSchemaArgs,
  ApiShieldSchemaValidationSettingsArgs,
} from '@pulumi/cloudflare'

export interface ApiShieldProps extends ApiShieldArgs {}
export interface ApiShieldSchemaProps extends ApiShieldSchemaArgs {}
export interface ApiShieldSchemaValidationSettingsProps extends ApiShieldSchemaValidationSettingsArgs {}
export interface ApiShieldOperationProps extends ApiShieldOperationArgs {}
export interface ApiShieldOperationSchemaValidationSettingsProps extends ApiShieldOperationSchemaValidationSettingsArgs {}
