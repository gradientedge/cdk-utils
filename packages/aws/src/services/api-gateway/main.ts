import { RemovalPolicy, Size, Tags } from 'aws-cdk-lib'
import {
  Cors,
  Deployment,
  DomainName,
  EndpointType,
  IAuthorizer,
  IResource,
  IRestApi,
  Integration,
  LambdaRestApi,
  LogGroupLogDestination,
  MethodResponse,
  SecurityPolicy,
} from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import _ from 'lodash'

import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'

import { LambdaRestApiProps } from './types.js'

/**
 * Provides operations on AWS API Gateway.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     const lambdaFunction = this.lambdaManager.createLambdaFunction('MyFunction', this, role, layers, code)
 *     this.apiManager.createLambdaRestApi('MyCertificate', this, props, lambdaFunction)
 *   }
 * }
 * @see [CDK API Gateway Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html}
 * @category Service
 */
export class ApiManager {
  /**
   * @summary Method to create a Rest API with Lambda backend/target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props lambda rest restApi props
   * @param lambdaFunction the Lambda function to use as the backend handler
   */
  public createLambdaRestApi(id: string, scope: CommonConstruct, props: LambdaRestApiProps, lambdaFunction: IFunction) {
    if (!props) throw new Error(`Api props undefined for ${id}`)
    if (!props.restApiName) throw new Error(`Api restApiName undefined for ${id}`)

    const restApiName = scope.resourceNameFormatter.format(
      props.restApiName,
      scope.props.resourceNameOptions?.apigateway
    )
    const restApiAccessLogName = scope.resourceNameFormatter.format(
      `${props.restApiName}-access`,
      scope.props.resourceNameOptions?.apigateway
    )

    const accessLogGroup = scope.logManager.createLogGroup(`${id}-rest-api-access-log`, scope, {
      logGroupName: restApiAccessLogName,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const api = new LambdaRestApi(scope, `${id}`, {
      ...props,
      cloudWatchRole: props.cloudWatchRole || false,
      deploy: props.deploy || true,
      deployOptions: {
        ...props.deployOptions,
        accessLogDestination: new LogGroupLogDestination(accessLogGroup),
        description: `${id} - ${scope.props.stage} stage`,
        stageName: scope.props.stage,
      },
      endpointConfiguration: {
        ...props.endpointConfiguration,
        types: props.endpointConfiguration?.types || [EndpointType.REGIONAL],
      },
      failOnWarnings: props.failOnWarnings || false,
      handler: lambdaFunction,
      minCompressionSize: props.minCompressionSizeInBytes ? Size.bytes(props.minCompressionSizeInBytes) : undefined,
      proxy: props.proxy ?? true,
      restApiName,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(api).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-restApiId`, scope, api.restApiId)
    createCfnOutput(`${id}-restApiName`, scope, api.restApiName)

    return api
  }

  /**
   * @summary Method to create custom restApi domain
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param domainName the domain name to use
   * @param certificate the certificate used for custom restApi domain
   */
  public createApiDomain(id: string, scope: CommonConstruct, domainName: string, certificate: ICertificate) {
    const apiDomain = new DomainName(scope, `${id}`, {
      certificate,
      domainName,
      endpointType: scope.isProductionStage() ? EndpointType.EDGE : EndpointType.REGIONAL,
      securityPolicy: SecurityPolicy.TLS_1_2,
    })

    createCfnOutput(`${id}-customDomainName`, scope, apiDomain.domainName)

    return apiDomain
  }

  /**
   * @summary Method to create an API gateway resource with methods, optional CORS, and optional proxy sub-resource
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param parent the parent API resource to attach this resource to
   * @param path the URL path segment for this resource
   * @param integration the backend integration for methods on this resource
   * @param addProxy whether to create a greedy proxy child resource ({path+})
   * @param authorizer optional authorizer for the methods
   * @param allowedOrigins optional CORS allowed origins (defaults to all origins)
   * @param allowedMethods optional CORS allowed methods (defaults to all methods)
   * @param allowedHeaders optional CORS allowed headers (defaults to default headers)
   * @param methodRequestParameters optional request parameter mappings for methods
   * @param proxyIntegration optional alternative integration for the proxy resource
   * @param enableDefaultCors set to false to disable automatic CORS preflight configuration
   * @param mockIntegration optional mock integration for OPTIONS when CORS is disabled
   * @param mockMethodResponses optional method responses for the mock OPTIONS integration
   */
  public createApiResource(
    id: string,
    scope: CommonConstruct,
    parent: IResource,
    path: string,
    integration: Integration,
    addProxy: boolean,
    authorizer?: IAuthorizer,
    allowedOrigins?: string[],
    allowedMethods?: string[],
    allowedHeaders?: string[],
    methodRequestParameters?: { [param: string]: boolean },
    proxyIntegration?: Integration,
    enableDefaultCors?: boolean,
    mockIntegration?: Integration,
    mockMethodResponses?: MethodResponse[]
  ) {
    const methods = allowedMethods ?? Cors.ALL_METHODS

    /* enableDefaultCors uses strict equality — only `false` disables CORS.
       When CORS is disabled, OPTIONS requests are routed to the mock integration instead. */
    let defaultCorsPreflightOptions
    if (enableDefaultCors === false) {
      defaultCorsPreflightOptions = undefined
    } else {
      defaultCorsPreflightOptions = {
        allowCredentials: true,
        allowHeaders: allowedHeaders ?? Cors.DEFAULT_HEADERS,
        allowMethods: [...methods, 'OPTIONS'],
        allowOrigins: allowedOrigins ?? Cors.ALL_ORIGINS,
      }
    }

    const resource = parent.addResource(path, {
      defaultCorsPreflightOptions: defaultCorsPreflightOptions,
    })

    /* When CORS is disabled, route OPTIONS to the mock integration for manual
       CORS handling; all other methods use the real integration */
    _.forEach(methods, method => {
      if (enableDefaultCors === false && mockIntegration && method === 'OPTIONS') {
        resource.addMethod(method, mockIntegration, {
          authorizer,
          requestParameters: methodRequestParameters,
          methodResponses: mockMethodResponses,
        })
      } else {
        resource.addMethod(method, integration, {
          authorizer,
          requestParameters: methodRequestParameters,
        })
      }
    })
    createCfnOutput(`${id}-${path}ResourceId`, scope, resource.resourceId)

    /* Create a greedy proxy resource ({path+}) to catch all sub-paths.
       Uses proxyIntegration if provided, otherwise falls back to the main integration. */
    if (addProxy) {
      const resourceProxy = resource.addResource(`{${path}+}`, {
        defaultCorsPreflightOptions: defaultCorsPreflightOptions,
      })

      _.forEach(methods, method => {
        if (enableDefaultCors === false && mockIntegration && method === 'OPTIONS') {
          resourceProxy.addMethod(method, mockIntegration, {
            authorizer,
            requestParameters: methodRequestParameters,
            methodResponses: mockMethodResponses,
          })
        } else {
          resourceProxy.addMethod(method, proxyIntegration ?? integration, {
            authorizer,
            requestParameters: methodRequestParameters,
          })
        }
      })
      createCfnOutput(`${id}-${path}ProxyResourceId`, scope, resourceProxy.resourceId)
    }

    return resource
  }

  /**
   * @summary Method to create an api deployment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param api the REST API to create a deployment for
   */
  public createApiDeployment(id: string, scope: CommonConstruct, api: IRestApi) {
    new Deployment(scope, `${id}`, {
      api,
      retainDeployments: false,
    })
  }
}
