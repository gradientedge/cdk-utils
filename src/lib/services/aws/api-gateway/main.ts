import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as utils from '../../../utils'
import * as cdk from 'aws-cdk-lib'
import { LambdaRestApiProps } from './types'
import { CommonConstruct } from '../../../common'

/**
 * @classdesc Provides operations on AWS API Gateway.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     const lambdaFunction = this.lambdaManager.createLambdaFunction('MyFunction', this, role, layers, code)
 *     this.apiManager.createLambdaRestApi('MyCertificate', this, props, lambdaFunction)
 *   }
 * }
 * @see [CDK API Gateway Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html}
 */
export class ApiManager {
  /**
   * @summary Method to create a Rest API with Lambda backend/target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props lambda rest restApi props
   * @param lambdaFunction
   */
  public createLambdaRestApi(
    id: string,
    scope: CommonConstruct,
    props: LambdaRestApiProps,
    lambdaFunction: lambda.IFunction
  ) {
    if (!props) throw `Api props undefined for ${id}`
    const api = new apig.LambdaRestApi(scope, `${id}`, {
      binaryMediaTypes: props.binaryMediaTypes,
      cloudWatchRole: props.cloudWatchRole || false,
      defaultCorsPreflightOptions: props.defaultCorsPreflightOptions,
      defaultMethodOptions: props.defaultMethodOptions,
      deploy: props.deploy || true,
      deployOptions: {
        accessLogDestination: props.deployOptions?.accessLogDestination,
        accessLogFormat: props.deployOptions?.accessLogFormat,
        cacheClusterEnabled: props.deployOptions?.cacheClusterEnabled,
        cacheClusterSize: props.deployOptions?.cacheClusterSize,
        cachingEnabled: props.deployOptions?.cachingEnabled,
        clientCertificateId: props.deployOptions?.clientCertificateId,
        dataTraceEnabled: props.deployOptions?.dataTraceEnabled,
        description: `${id} - ${scope.props.stage} stage`,
        documentationVersion: props.deployOptions?.documentationVersion,
        loggingLevel: props.deployOptions?.loggingLevel,
        methodOptions: props.deployOptions?.methodOptions,
        metricsEnabled: props.deployOptions?.metricsEnabled,
        stageName: scope.props.stage,
        tracingEnabled: props.deployOptions?.tracingEnabled,
        variables: props.deployOptions?.variables,
      },
      domainName: props.domainName,
      endpointConfiguration: {
        types: props.endpointConfiguration?.types || [apig.EndpointType.REGIONAL],
        vpcEndpoints: props.endpointConfiguration?.vpcEndpoints,
      },
      endpointTypes: props.endpointTypes,
      failOnWarnings: props.failOnWarnings || false,
      handler: lambdaFunction,
      minCompressionSize: props.minCompressionSize,
      parameters: props.parameters,
      policy: props.policy,
      proxy: props.proxy ?? true,
      restApiName: `${props.restApiName}-${scope.props.stage}`,
      retainDeployments: props.retainDeployments,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(api).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-restApiId`, scope, api.restApiId)
    utils.createCfnOutput(`${id}-restApiName`, scope, api.restApiName)

    return api
  }

  /**
   * @summary Method to create custom restApi domain
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param domainName the domain name to use
   * @param certificate the certificate used for custom restApi domain
   */
  public createApiDomain(id: string, scope: CommonConstruct, domainName: string, certificate: acm.ICertificate) {
    const apiDomain = new apig.DomainName(scope, `${id}`, {
      certificate: certificate,
      domainName: domainName,
      endpointType: scope.isProductionStage() ? apig.EndpointType.EDGE : apig.EndpointType.REGIONAL,
      securityPolicy: apig.SecurityPolicy.TLS_1_2,
    })

    utils.createCfnOutput(`${id}-customDomainName`, scope, apiDomain.domainName)

    return apiDomain
  }

  /**
   * @summary Method to create an API gateway resource
   * @param id
   * @param scope
   * @param parent
   * @param path
   * @param integration
   * @param addProxy
   * @param authorizer
   * @param allowedOrigins
   * @param allowedMethods
   * @param allowedHeaders
   * @param methodRequestParameters
   * @param proxyIntegration
   */
  public createApiResource(
    id: string,
    scope: CommonConstruct,
    parent: apig.IResource,
    path: string,
    integration: apig.Integration,
    addProxy: boolean,
    authorizer?: apig.IAuthorizer,
    allowedOrigins?: string[],
    allowedMethods?: string[],
    allowedHeaders?: string[],
    methodRequestParameters?: any,
    proxyIntegration?: apig.Integration
  ) {
    const methods = allowedMethods ?? apig.Cors.ALL_METHODS
    const resource = parent.addResource(path, {
      defaultCorsPreflightOptions: {
        allowCredentials: true,
        allowHeaders: allowedHeaders ?? apig.Cors.DEFAULT_HEADERS,
        allowMethods: [...methods, 'OPTIONS'],
        allowOrigins: allowedOrigins ?? apig.Cors.ALL_ORIGINS,
      },
    })
    methods.forEach(method =>
      resource.addMethod(method, integration, {
        authorizer,
        requestParameters: methodRequestParameters,
      })
    )
    utils.createCfnOutput(`${id}-${path}ResourceId`, scope, resource.resourceId)

    if (addProxy) {
      const resourceProxy = resource.addResource(`{${path}+}`, {
        defaultCorsPreflightOptions: {
          allowCredentials: true,
          allowHeaders: allowedHeaders ?? apig.Cors.DEFAULT_HEADERS,
          allowMethods: [...methods, 'OPTIONS'],
          allowOrigins: allowedOrigins ?? apig.Cors.ALL_ORIGINS,
        },
      })
      methods.forEach(method =>
        resourceProxy.addMethod(method, proxyIntegration ?? integration, {
          authorizer,
          requestParameters: methodRequestParameters,
        })
      )
      utils.createCfnOutput(`${id}-${path}ProxyResourceId`, scope, resourceProxy.resourceId)
    }

    return resource
  }

  /**
   * @summary Method to create an api deployment
   * @param id
   * @param scope
   * @param restApi
   */
  public createApiDeployment(id: string, scope: CommonConstruct, restApi: apig.IRestApi) {
    new apig.Deployment(scope, `${id}`, {
      api: restApi,
      retainDeployments: false,
    })
  }
}