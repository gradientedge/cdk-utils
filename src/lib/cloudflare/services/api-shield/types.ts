import { ApiShieldConfig } from '@cdktf/provider-cloudflare/lib/api-shield'
import { ApiShieldOperationConfig } from '@cdktf/provider-cloudflare/lib/api-shield-operation'
import { ApiShieldOperationSchemaValidationSettingsConfig } from '@cdktf/provider-cloudflare/lib/api-shield-operation-schema-validation-settings'
import { ApiShieldSchemaConfig } from '@cdktf/provider-cloudflare/lib/api-shield-schema'
import { ApiShieldSchemaValidationSettingsConfig } from '@cdktf/provider-cloudflare/lib/api-shield-schema-validation-settings'

export interface ApiShieldProps extends ApiShieldConfig {}
export interface ApiShieldSchemaProps extends ApiShieldSchemaConfig {}
export interface ApiShieldSchemaValidationSettingsProps extends ApiShieldSchemaValidationSettingsConfig {}
export interface ApiShieldOperationProps extends ApiShieldOperationConfig {}
export interface ApiShieldOperationSchemaValidationSettingsProps
  extends ApiShieldOperationSchemaValidationSettingsConfig {}
