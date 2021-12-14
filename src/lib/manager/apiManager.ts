import { CommonConstruct } from '../common/commonConstruct'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import { createCfnOutput } from '../utils'

/**
 *
 */
export class ApiManager {
  /**
   *
   * @param id
   * @param scope
   * @param props
   * @param lambdaFunction
   */
  public createLambdaRestApi(
    id: string,
    scope: CommonConstruct,
    props: apig.LambdaRestApiProps,
    lambdaFunction: lambda.Function
  ) {
    const api = new apig.LambdaRestApi(scope, `${id}-lambda-rest-api`, {
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
        description: `${id}-lambda-rest-api - ${scope.props.stage} stage`,
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
        types: props.endpointConfiguration?.types || [apig.EndpointType.EDGE],
        vpcEndpoints: props.endpointConfiguration?.vpcEndpoints,
      },
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
   *
   * @param id
   * @param scope
   * @param domainName
   * @param certificate
   */
  public createApiDomain(
    id: string,
    scope: CommonConstruct,
    domainName: string,
    certificate: acm.ICertificate
  ) {
    const apiDomain = new apig.DomainName(scope, `${id}`, {
      domainName: domainName,
      certificate: certificate,
      endpointType: apig.EndpointType.EDGE,
      securityPolicy: apig.SecurityPolicy.TLS_1_2,
    })

    createCfnOutput(`${id}-customDomainName`, scope, apiDomain.domainName)

    return apiDomain
  }
}
