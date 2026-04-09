import {
  Api,
  ApiManagementService,
  Backend,
  GetApiManagementServiceResult,
} from '@pulumi/azure-native/apimanagement/index.js'
import * as redisenterprise from '@pulumi/azure-native/redisenterprise/index.js'
import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import {
  ApiManagementApiProps,
  ApiManagementBackendProps,
  ApiManagementCustomDomainProps,
  ApiManagementProps,
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ResolveApiManagementProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testApiManagement: ApiManagementProps
  testApiManagementBackend: ApiManagementBackendProps
  testApiManagementApi: ApiManagementApiProps
  testApiManagementCustomDomain: ApiManagementCustomDomainProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/api-management.json',
  ],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
  subscriptionId: 'subscriptionId',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestCommonConstruct(testStackProps.name, this.props)
  }

  protected determineConstructProps(props: TestAzureStackProps): TestAzureStackProps {
    const baseProps = super.determineConstructProps(props)
    return { ...baseProps, testApiManagement: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  apiManagementService: ApiManagementService
  apiBackend: Backend
  api: Api
  // Note: Custom domain configuration not tested as it should be done via hostnameConfigurations
  // property of ApiManagementService in Pulumi Azure Native
  resolvedApiManagement: pulumi.Output<GetApiManagementServiceResult>

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.apiManagementService = this.apiManagementManager.createApiManagementService(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagement
    )

    this.apiBackend = this.apiManagementManager.createBackend(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagementBackend
    )

    this.api = this.apiManagementManager.createApi(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagementApi
    )

    this.resolvedApiManagement = this.apiManagementManager.resolveApiManagementService(
      `test-resolve-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagement as ResolveApiManagementProps
    )
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:apimanagement:ApiManagementService') {
      name = args.inputs.serviceName
    } else if (args.type === 'azure-native:apimanagement:Backend') {
      name = args.inputs.backendId
    } else if (args.type === 'azure-native:apimanagement:Api') {
      name = args.inputs.apiId
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureApiManagementConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-api-management-dev')
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.apiManagementService).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.apiManagementService.id,
          stack.construct.apiManagementService.urn,
          stack.construct.apiManagementService.name,
          stack.construct.apiManagementService.location,
          stack.construct.apiManagementService.sku,
          stack.construct.apiManagementService.tags,
        ])
        .apply(([id, urn, name, location, sku, tags]) => {
          expect(id).toEqual('test-api-management-dev-am-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:apimanagement:ApiManagementService::test-api-management-dev-am'
          )
          expect(name).toEqual('test-api-management-dev')
          expect(location).toEqual('eastus')
          expect(sku).toEqual({ capacity: 1, name: 'Developer' })
          expect(tags?.environment).toEqual('dev')
        })
    )
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management backend as expected', () => {
    expect(stack.construct.apiBackend).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('api management custom domain throws error as expected', () => {
    // Custom domains should be configured via hostnameConfigurations property
    // of ApiManagementService in Pulumi Azure Native
    expect(() => stack.construct.apiManagementManager.createApiManagementCustomDomain()).toThrow(
      'Custom domains should be configured via the hostnameConfigurations property'
    )
  })
})

// Test for API Management with Application Insights logger
class TestConstructWithLogger extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  apiManagementService: ApiManagementService

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.apiManagementService = this.apiManagementManager.createApiManagementService(
      `test-api-management-with-logger-${this.props.stage}`,
      this,
      this.props.testApiManagement,
      'test-app-insights-key'
    )
  }
}

class TestStackWithLogger extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithLogger

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithLogger(props.name, this.props)
  }
}

describe('TestAzureApiManagementWithLogger', () => {
  test('provisions api management with application insights logger', () => {
    const stackWithLogger = new TestStackWithLogger('test-stack-with-logger', testStackProps)
    expect(stackWithLogger.construct.apiManagementService).toBeDefined()
  })
})

// Test for API Management with external Azure Managed Redis (Enterprise) cache
class TestConstructWithRedis extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  apiManagementService: ApiManagementService
  redisCluster: redisenterprise.RedisEnterprise
  redisDatabase: redisenterprise.Database

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    // Create a mock Redis Enterprise cluster
    this.redisCluster = new redisenterprise.RedisEnterprise(
      'test-redis-cluster',
      {
        clusterName: 'test-redis-cache',
        resourceGroupName: props.resourceGroupName!,
        location: props.location!,
        sku: {
          name: 'Balanced_B0',
        },
      },
      { parent: this }
    )

    // Create a mock Redis Enterprise database
    this.redisDatabase = new redisenterprise.Database(
      'test-redis-db',
      {
        clusterName: this.redisCluster.name,
        resourceGroupName: props.resourceGroupName!,
        databaseName: 'default',
      },
      { parent: this, dependsOn: [this.redisCluster] }
    )

    this.apiManagementService = this.apiManagementManager.createApiManagementService(
      `test-api-management-with-redis-${this.props.stage}`,
      this,
      this.props.testApiManagement,
      undefined,
      { cluster: this.redisCluster, database: this.redisDatabase }
    )
  }
}

class TestStackWithRedis extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithRedis

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithRedis(props.name, this.props)
  }
}

describe('TestAzureApiManagementWithRedis', () => {
  test('provisions api management with external redis enterprise cache', () => {
    const stackWithRedis = new TestStackWithRedis('test-stack-with-redis', testStackProps)
    expect(stackWithRedis.construct.apiManagementService).toBeDefined()
    expect(stackWithRedis.construct.redisCluster).toBeDefined()
    expect(stackWithRedis.construct.redisDatabase).toBeDefined()
  })
})

// Test for API with caching operations
class TestConstructWithCaching extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  apiManagementService: ApiManagementService
  api: Api

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.apiManagementService = this.apiManagementManager.createApiManagementService(
      `test-api-management-caching-${this.props.stage}`,
      this,
      this.props.testApiManagement
    )

    const apiPropsWithCaching: ApiManagementApiProps = {
      ...this.props.testApiManagementApi,
      operations: [
        {
          apiId: 'test-api',
          resourceGroupName: props.resourceGroupName!,
          serviceName: 'test-service',
          displayName: 'test-cached-get',
          method: 'get',
          urlTemplate: '/cached-test',
          caching: {
            enableCacheSet: true,
            enableCacheInvalidation: true,
            ttlInSecs: 900,
            cachingType: 'prefer-external',
          },
        },
        {
          apiId: 'test-api',
          resourceGroupName: props.resourceGroupName!,
          serviceName: 'test-service',
          displayName: 'test-cached-post',
          method: 'post',
          urlTemplate: '/cached-test',
          caching: {
            enableCacheSet: false,
            enableCacheInvalidation: true,
            ttlInSecs: 600,
            cachingType: 'internal',
          },
        },
      ],
      rateLimit: {
        calls: 100,
        renewalPeriodInSecs: 60,
      },
      commonInboundPolicyXml:
        '<set-header name="X-Custom-Header" exists-action="override"><value>test</value></set-header>',
      commonOutboundPolicyXml:
        '<set-header name="X-Response-Header" exists-action="override"><value>test</value></set-header>',
    }

    this.api = this.apiManagementManager.createApi(
      `test-api-management-caching-${this.props.stage}`,
      this,
      apiPropsWithCaching
    )
  }
}

class TestStackWithCaching extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithCaching

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithCaching(props.name, this.props)
  }
}

describe('TestAzureApiManagementWithCaching', () => {
  test('provisions api with caching operations', () => {
    const stackWithCaching = new TestStackWithCaching('test-stack-with-caching', testStackProps)
    expect(stackWithCaching.construct.apiManagementService).toBeDefined()
    expect(stackWithCaching.construct.api).toBeDefined()
  })
})

/* --- Tests for createApiDiagnostic, createLogger, createNamedValue, createSubscription, createCache, createOperation, createOperationPolicy --- */

import {
  ApiDiagnostic,
  ApiOperation,
  ApiOperationPolicy,
  ApiPolicy,
  Cache,
  Logger,
  NamedValue,
  Subscription as ApiSubscription,
} from '@pulumi/azure-native/apimanagement/index.js'
import {
  ApiDiagnosticProps,
  ApiOperationPolicyProps,
  ApiOperationProps,
  ApiPolicyProps,
  ApiSubscriptionProps,
  CacheProps,
  LoggerProps,
  NamedValueProps,
} from '../../src/index.js'

class TestConstructWithExtraApimMethods extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  apiDiagnostic: ApiDiagnostic
  apiLogger: Logger
  apiNamedValue: NamedValue
  apiSubscription: ApiSubscription
  apiCache: Cache
  apiOperation: ApiOperation
  apiOperationPolicy: ApiOperationPolicy

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)

    this.apiDiagnostic = this.apiManagementManager.createApiDiagnostic(
      `test-api-diagnostic-${this.props.stage}`,
      this,
      {
        diagnosticId: 'applicationinsights',
        apiId: 'test-api',
        resourceGroupName: 'test-rg-dev',
        serviceName: 'test-service',
        loggerId: 'test-logger-id',
      } as ApiDiagnosticProps
    )

    this.apiLogger = this.apiManagementManager.createLogger(`test-api-logger-${this.props.stage}`, this, {
      resourceGroupName: 'test-rg-dev',
      serviceName: 'test-service',
      loggerType: 'applicationInsights',
      credentials: { instrumentationKey: 'test-key' },
    } as LoggerProps)

    this.apiNamedValue = this.apiManagementManager.createNamedValue(`test-api-nv-${this.props.stage}`, this, {
      displayName: 'test-named-value',
      resourceGroupName: 'test-rg-dev',
      serviceName: 'test-service',
      secret: true,
    } as NamedValueProps)

    this.apiSubscription = this.apiManagementManager.createSubscription(`test-api-sub-${this.props.stage}`, this, {
      serviceName: 'test-service',
      resourceGroupName: 'test-rg-dev',
      displayName: 'test-subscription',
      state: 'active',
      scope: '/subscriptions/test-sub/resourceGroups/test-rg-dev',
    } as ApiSubscriptionProps)

    this.apiCache = this.apiManagementManager.createCache(`test-api-cache-${this.props.stage}`, this, {
      serviceName: 'test-service',
      resourceGroupName: 'test-rg-dev',
      connectionString: 'test-connection-string',
      cacheId: 'test-cache-id',
      useFromLocation: 'eastus',
    } as CacheProps)

    this.apiOperation = this.apiManagementManager.createOperation(`test-api-op-${this.props.stage}`, this, {
      apiId: 'test-api',
      resourceGroupName: 'test-rg-dev',
      serviceName: 'test-service',
      operationId: 'test-operation',
      displayName: 'Test Operation',
      method: 'GET',
      urlTemplate: '/test',
    } as ApiOperationProps)

    this.apiOperationPolicy = this.apiManagementManager.createOperationPolicy(
      `test-api-op-policy-${this.props.stage}`,
      this,
      {
        apiId: 'test-api',
        resourceGroupName: 'test-rg-dev',
        serviceName: 'test-service',
        operationId: 'test-operation',
        value: '<policies><inbound><base /></inbound></policies>',
      } as ApiOperationPolicyProps
    )
  }
}

class TestStackWithExtraApimMethods extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithExtraApimMethods

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithExtraApimMethods(props.name, this.props)
  }
}

const stackWithExtraMethods = new TestStackWithExtraApimMethods('test-extra-apim-stack', testStackProps)

describe('TestAzureApiManagementExtraMethods', () => {
  test('provisions api diagnostic as expected', () => {
    expect(stackWithExtraMethods.construct.apiDiagnostic).toBeDefined()
  })

  test('provisions api logger as expected', () => {
    expect(stackWithExtraMethods.construct.apiLogger).toBeDefined()
  })

  test('provisions api named value as expected', () => {
    expect(stackWithExtraMethods.construct.apiNamedValue).toBeDefined()
  })

  test('provisions api subscription as expected', () => {
    expect(stackWithExtraMethods.construct.apiSubscription).toBeDefined()
  })

  test('provisions api cache as expected', () => {
    expect(stackWithExtraMethods.construct.apiCache).toBeDefined()
  })

  test('provisions api operation as expected', () => {
    expect(stackWithExtraMethods.construct.apiOperation).toBeDefined()
  })

  test('provisions api operation policy as expected', () => {
    expect(stackWithExtraMethods.construct.apiOperationPolicy).toBeDefined()
  })
})

describe('TestAzureApiManagementExtraMethods - Error Handling', () => {
  test('createApiDiagnostic throws when props are undefined', () => {
    expect(() => {
      stackWithExtraMethods.construct.apiManagementManager.createApiDiagnostic(
        'test-diag-err',
        stackWithExtraMethods.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-diag-err')
  })

  test('createLogger throws when props are undefined', () => {
    expect(() => {
      stackWithExtraMethods.construct.apiManagementManager.createLogger(
        'test-logger-err',
        stackWithExtraMethods.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-logger-err')
  })

  test('createNamedValue throws when props are undefined', () => {
    expect(() => {
      stackWithExtraMethods.construct.apiManagementManager.createNamedValue(
        'test-nv-err',
        stackWithExtraMethods.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-nv-err')
  })

  test('createSubscription throws when props are undefined', () => {
    expect(() => {
      stackWithExtraMethods.construct.apiManagementManager.createSubscription(
        'test-sub-err',
        stackWithExtraMethods.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-sub-err')
  })

  test('createCache throws when props are undefined', () => {
    expect(() => {
      stackWithExtraMethods.construct.apiManagementManager.createCache(
        'test-cache-err',
        stackWithExtraMethods.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-cache-err')
  })
})

/* --- Tests for createPolicy --- */

class TestConstructWithPolicy extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  apiManagementService: ApiManagementService
  apiPolicy: ApiPolicy

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.apiManagementService = this.apiManagementManager.createApiManagementService(
      `test-api-management-policy-${this.props.stage}`,
      this,
      this.props.testApiManagement
    )

    this.apiPolicy = this.apiManagementManager.createPolicy(`test-api-policy-${this.props.stage}`, this, {
      serviceName: this.apiManagementService.name,
      apiId: 'test-api',
      resourceGroupName: 'test-rg-dev',
      value: '<policies><inbound><base /></inbound></policies>',
    } as ApiPolicyProps)
  }
}

class TestStackWithPolicy extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithPolicy

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithPolicy(props.name, this.props)
  }
}

describe('TestAzureApiManagementWithPolicy', () => {
  test('provisions api policy as expected', async () => {
    const stackWithPolicy = new TestStackWithPolicy('test-stack-with-policy', testStackProps)
    expect(stackWithPolicy.construct.apiPolicy).toBeDefined()
    await outputToPromise(
      pulumi.all([stackWithPolicy.construct.apiPolicy.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })
})
