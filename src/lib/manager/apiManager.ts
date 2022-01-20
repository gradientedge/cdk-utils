import { CommonConstruct } from '../common/commonConstruct'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import { createCfnOutput } from '../utils'

/**
 * @stability stable
 * @category Networking & Content Delivery
 * @summary Provides operations on AWS API Gateway.
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
 *
 * @see [CDK API Gateway Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html}
 */
export class ApiManager {
  /**
   * @summary Method to create a Rest API with Lambda backend/target
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {AcmProps} props lambda rest api props
   * @param lambdaFunction
   */
  public createLambdaRestApi(
    id: string,
    scope: CommonConstruct,
    props: apig.LambdaRestApiProps,
    lambdaFunction: lambda.Function
  ) {
    const api = new apig.LambdaRestApi(scope, `${id}`, {
      binaryMediaTypes: props.binaryMediaTypes,
      minimumCompressionSize: props.minimumCompressionSize,
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
      defaultCorsPreflightOptions: {
        allowOrigins: props.defaultCorsPreflightOptions?.allowOrigins || apig.Cors.ALL_ORIGINS,
        allowMethods: props.defaultCorsPreflightOptions?.allowMethods || apig.Cors.ALL_METHODS,
      },
      proxy: props.proxy || true,
    })

    createCfnOutput(`${id}-restApiId`, scope, api.restApiId)
    createCfnOutput(`${id}-restApiName`, scope, api.restApiName)

    return api
  }

  /**
   * @summary Method to create custom api domain
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param domainName the domain name to use
   * @param certificate the certificate used for custom api domain
   */
  public createApiDomain(id: string, scope: CommonConstruct, domainName: string, certificate: acm.ICertificate) {
    const apiDomain = new apig.DomainName(scope, `${id}`, {
      domainName: domainName,
      certificate: certificate,
      endpointType: scope.isProductionStage() ? apig.EndpointType.EDGE : apig.EndpointType.REGIONAL,
      securityPolicy: apig.SecurityPolicy.TLS_1_2,
    })

    createCfnOutput(`${id}-customDomainName`, scope, apiDomain.domainName)

    return apiDomain
  }
}
