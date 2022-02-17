import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as common from '../../common'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.api-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS API Gateway.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import { common.CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     const lambdaFunction = this.lambdaManager.createLambdaFunction('MyFunction', this, role, layers, code)
 *     this.apiManager.createLambdaRestApi('MyCertificate', this, props, lambdaFunction)
 *   }
 * }
 *
 * @see [CDK API Gateway Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html}
 */
export class ApiManager {
  /**
   * @summary Method to create a Rest API with Lambda backend/target
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {AcmProps} props lambda rest restApi props
   * @param lambdaFunction
   */
  public createLambdaRestApi(
    id: string,
    scope: common.CommonConstruct,
    props: apig.LambdaRestApiProps,
    lambdaFunction: lambda.Function
  ) {
    const api = new apig.LambdaRestApi(scope, `${id}`, {
      binaryMediaTypes: props.binaryMediaTypes,
      minimumCompressionSize: props.minimumCompressionSize,
      defaultMethodOptions: props.defaultMethodOptions,
      deploy: props.deploy || true,
      deployOptions: {
        stageName: scope.props.stage,
        accessLogDestination: props.deployOptions?.accessLogDestination,
        accessLogFormat: props.deployOptions?.accessLogFormat,
        tracingEnabled: props.deployOptions?.tracingEnabled,
        cacheClusterEnabled: props.deployOptions?.cacheClusterEnabled,
        cacheClusterSize: props.deployOptions?.cacheClusterSize,
        clientCertificateId: props.deployOptions?.clientCertificateId,
        description: `${id} - ${scope.props.stage} stage`,
        documentationVersion: props.deployOptions?.documentationVersion,
        variables: props.deployOptions?.variables,
        methodOptions: props.deployOptions?.methodOptions,
      },
      retainDeployments: props.retainDeployments,
      parameters: props.parameters,
      policy: props.policy,
      failOnWarnings: props.failOnWarnings || false,
      domainName: props.domainName,
      cloudWatchRole: props.cloudWatchRole || false,
      endpointTypes: props.endpointTypes,
      endpointConfiguration: {
        types: props.endpointConfiguration?.types || [apig.EndpointType.REGIONAL],
        vpcEndpoints: props.endpointConfiguration?.vpcEndpoints,
      },
      restApiName: `${props.restApiName}-${scope.props.stage}`,
      handler: lambdaFunction,
      defaultCorsPreflightOptions: props.defaultCorsPreflightOptions,
      proxy: props.proxy ?? true,
    })

    utils.createCfnOutput(`${id}-restApiId`, scope, api.restApiId)
    utils.createCfnOutput(`${id}-restApiName`, scope, api.restApiName)

    return api
  }

  /**
   * @summary Method to create custom restApi domain
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param domainName the domain name to use
   * @param certificate the certificate used for custom restApi domain
   */
  public createApiDomain(id: string, scope: common.CommonConstruct, domainName: string, certificate: acm.ICertificate) {
    const apiDomain = new apig.DomainName(scope, `${id}`, {
      domainName: domainName,
      certificate: certificate,
      endpointType: scope.isProductionStage() ? apig.EndpointType.EDGE : apig.EndpointType.REGIONAL,
      securityPolicy: apig.SecurityPolicy.TLS_1_2,
    })

    utils.createCfnOutput(`${id}-customDomainName`, scope, apiDomain.domainName)

    return apiDomain
  }

  /**
   * @summary Method to create an API gateway resource
   * @param {string} id
   * @param {common.CommonConstruct} scope
   * @param {apig.IResource} parent
   * @param {string} path
   * @param {apig.Integration} integration
   * @param {boolean} addProxy
   * @param {apig.IAuthorizer} authorizer
   * @param {string[]?} allowedOrigins
   * @param {string[]?} allowedMethods
   * @param {string[]?} allowedHeaders
   */
  public createApiResource(
    id: string,
    scope: common.CommonConstruct,
    parent: apig.IResource,
    path: string,
    integration: apig.Integration,
    addProxy: boolean,
    authorizer?: apig.IAuthorizer,
    allowedOrigins?: string[],
    allowedMethods?: string[],
    allowedHeaders?: string[]
  ) {
    const methods = allowedMethods ?? apig.Cors.ALL_METHODS
    const resource = parent.addResource(path, {
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins ?? apig.Cors.ALL_ORIGINS,
        allowMethods: [...methods, 'OPTIONS'],
        allowHeaders: allowedHeaders ?? apig.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    })
    methods.forEach(method => resource.addMethod(method, integration, { authorizer }))
    utils.createCfnOutput(`${id}-${path}ResourceId`, scope, resource.resourceId)

    if (addProxy) {
      const resourceProxy = resource.addResource(`{${path}+}`, {
        defaultCorsPreflightOptions: {
          allowOrigins: allowedOrigins ?? apig.Cors.ALL_ORIGINS,
          allowMethods: [...methods, 'OPTIONS'],
          allowHeaders: allowedHeaders ?? apig.Cors.DEFAULT_HEADERS,
          allowCredentials: true,
        },
      })
      methods.forEach(method => resourceProxy.addMethod(method, integration, { authorizer }))
      utils.createCfnOutput(`${id}-${path}ProxyResourceId`, scope, resourceProxy.resourceId)
    }

    return resource
  }

  /**
   * @summary Method to create an api deployment
   * @param {string} id
   * @param {common.CommonConstruct} scope
   * @param {apig.IRestApi} restApi
   */
  public createApiDeployment(id: string, scope: common.CommonConstruct, restApi: apig.IRestApi) {
    new apig.Deployment(scope, `${id}`, {
      api: restApi,
      retainDeployments: false,
    })
  }
}
