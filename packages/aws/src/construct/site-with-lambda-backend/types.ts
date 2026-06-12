import {
  CachePolicyProps,
  OriginRequestPolicyProps,
  ResponseHeadersPolicyProps,
  ResponseHeadersStrictTransportSecurity,
  ResponseSecurityHeadersBehavior,
} from 'aws-cdk-lib/aws-cloudfront'
import { IPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'

import { CommonStackProps } from '../../common/index.js'
import {
  AcmProps,
  CloudfrontFunctionProps,
  DistributionProps,
  LambdaProps,
  LogProps,
  S3BucketProps,
} from '../../services/index.js'

import { SiteWithLambdaBackendResponseHeaderPolicyType } from './constants.js'

/**
 * Properties for configuring a {@link SiteWithLambdaBackend} construct
 */
/** @category Interface */
export interface SiteWithLambdaBackendProps extends CommonStackProps {
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** Path to the Dockerfile used to invalidate the CloudFront cache after deployment */
  siteCacheInvalidationDockerFilePath?: string
  /** Configuration for the global (edge) SSL/TLS certificate */
  siteCertificate: AcmProps
  /** Configuration for a CloudFront function to attach to the distribution */
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  /** Configuration for the CloudFront distribution */
  siteDistribution: DistributionProps
  /** Path to the Lambda Web Adapter exec wrapper */
  siteExecWrapperPath: string
  /** Path to the CloudFront function code file */
  siteFunctionFilePath?: string
  /** The health check endpoint used by the Lambda Web Adapter */
  siteHealthEndpoint: string
  /** Configuration for the site Lambda function */
  siteLambda: LambdaProps
  /**
   * Additional IAM policy statements to attach to the site Lambda execution role.
   * Defaults to none — the role only has the CloudWatch Logs permissions granted by
   * `AWSLambdaBasicExecutionRole`. Use this to grant the Lambda access to specific
   * resources (e.g. invoking a sibling Function URL scoped to its ARN).
   */
  siteLambdaAdditionalPolicyStatements?: PolicyStatement[]
  /**
   * Auth type for the site Lambda Function URL.
   * Defaults to `FunctionUrlAuthType.AWS_IAM` so the URL is reachable only via the
   * CloudFront distribution signed through Origin Access Control. Set to
   * `FunctionUrlAuthType.NONE` to publish a public unauthenticated URL.
   */
  siteLambdaUrlAuthType?: FunctionUrlAuthType
  /**
   * Principals permitted to invoke the Function URL when `siteLambdaUrlAuthType` is
   * `FunctionUrlAuthType.NONE`. Defaults to `[new AnyPrincipal()]` for backwards
   * compatibility. Ignored when the auth type is `AWS_IAM`.
   */
  siteLambdaUrlInvokeGrantees?: IPrincipal[]
  /** Configuration for the site log group */
  siteLog: LogProps
  /** Configuration for the S3 bucket used for access logs */
  siteLogBucket: S3BucketProps
  /** The port the application listens on inside the Lambda container */
  sitePort: string
  /** Configuration for the CloudFront cache policy */
  siteCachePolicy?: SiteWithLambdaBackendCachePolicyProps
  /** Configuration for the CloudFront origin request policy */
  siteOriginRequestPolicy: OriginRequestPolicyProps
  /** Configuration for the CloudFront response headers policy */
  siteOriginResponseHeadersPolicy: SiteWithLambdaBackendResponseHeadersPolicyProps
  /** The Route53 record name for the site */
  siteRecordName?: string
  /** Configuration for the regional SSL/TLS certificate */
  siteRegionalCertificate: AcmProps
  /** The subdomain for the site */
  siteSubDomain: string
  /** The timezone for the application */
  timezone: string
  /** Whether to look up an existing hosted zone instead of creating one */
  useExistingHostedZone: boolean
  /** Whether to look up an existing VPC instead of creating one */
  useExistingVpc: boolean
}

/**
 * Extended strict transport security options with duration specified in seconds
 */
/** @category Interface */
export interface SiteWithLambdaBackendResponseHeadersStrictTransportSecurity extends ResponseHeadersStrictTransportSecurity {
  /** The max-age value for the Strict-Transport-Security header in seconds */
  accessControlMaxAgeInSeconds: number
}

/**
 * Extended security headers behaviour with strict transport security support
 */
/** @category Interface */
export interface SiteWithLambdaBackendSecurityHeadersBehavior extends ResponseSecurityHeadersBehavior {
  /** Strict transport security configuration */
  strictTransportSecurity: SiteWithLambdaBackendResponseHeadersStrictTransportSecurity
}

/**
 * Extended response headers policy properties with security headers and policy type
 */
/** @category Interface */
export interface SiteWithLambdaBackendResponseHeadersPolicyProps extends ResponseHeadersPolicyProps {
  /** Security headers behaviour configuration */
  securityHeadersBehavior: SiteWithLambdaBackendSecurityHeadersBehavior
  /** The policy type (origin or static) */
  type: SiteWithLambdaBackendResponseHeaderPolicyType
}

/**
 * Extended cache policy properties with TTL values specified in seconds
 */
/** @category Interface */
export interface SiteWithLambdaBackendCachePolicyProps extends CachePolicyProps {
  /** The default TTL for cached objects in seconds */
  defaultTtlInSeconds: number
  /** The minimum TTL for cached objects in seconds */
  minTtlInSeconds: number
  /** The maximum TTL for cached objects in seconds */
  maxTtlInSeconds: number
}
