import { ArgoSmartRoutingConfig } from '@cdktf/provider-cloudflare/lib/argo-smart-routing'
import { ArgoTieredCachingConfig } from '@cdktf/provider-cloudflare/lib/argo-tiered-caching'

export interface ArgoSmartRoutingProps extends ArgoSmartRoutingConfig {}
export interface ArgoTieredCachingProps extends ArgoTieredCachingConfig {}
