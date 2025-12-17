import { ApiShieldConfig } from '@cdktf/provider-cloudflare/lib/api-shield/index.js'
import { ApiShieldOperationConfig } from '@cdktf/provider-cloudflare/lib/api-shield-operation/index.js'
import { ApiShieldOperationSchemaValidationSettingsConfig } from '@cdktf/provider-cloudflare/lib/api-shield-operation-schema-validation-settings/index.js'
import { ApiShieldSchemaConfig } from '@cdktf/provider-cloudflare/lib/api-shield-schema/index.js'
import { ApiShieldSchemaValidationSettingsConfig } from '@cdktf/provider-cloudflare/lib/api-shield-schema-validation-settings/index.js'

export interface ApiShieldProps extends ApiShieldConfig {}
export interface ApiShieldSchemaProps extends ApiShieldSchemaConfig {}
export interface ApiShieldSchemaValidationSettingsProps extends ApiShieldSchemaValidationSettingsConfig {}
export interface ApiShieldOperationProps extends ApiShieldOperationConfig {}
export interface ApiShieldOperationSchemaValidationSettingsProps extends ApiShieldOperationSchemaValidationSettingsConfig {}
