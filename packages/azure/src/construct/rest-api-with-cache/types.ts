import { NamedValue } from '@pulumi/azure-native/apimanagement/index.js'
import { Secret } from '@pulumi/azure-native/keyvault/index.js'
import { Redis } from '@pulumi/azure-native/redis/index.js'

import { RedisProps } from '../../index.js'
import { AzureApi, AzureRestApiProps } from '../index.js'

export interface AzureRestApiWithCacheProps extends AzureRestApiProps {
  apiManagementManagedRedis: RedisProps
}

export interface AzureApiWithCache extends AzureApi {
  redis: Redis
  redisNamedValueSecret: Secret
  redisNamedValue: NamedValue
}
