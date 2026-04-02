# Contributing (Technical Guide)

This guide covers how to extend CDK Utils with new service managers, constructs, and features.

## Adding a New Service Manager

Service managers wrap a specific cloud service. Here's how to add one for AWS.

### 1. Create the types file

```
packages/aws/src/services/my-service/types.ts
```

```typescript
/** @category Interface */
export interface MyServiceProps {
  name: string
  // ... service-specific properties
}
```

### 2. Create the manager class

```
packages/aws/src/services/my-service/main.ts
```

```typescript
import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'
import { MyServiceProps } from './types.js'

/**
 * Provides operations on AWS MyService.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: CommonStackProps) {
 *     super(parent, id, props)
 *     this.myServiceManager.createResource('MyResource', this, props)
 *   }
 * }
 * ```
 * @category Service
 */
export class MyServiceManager {
  public createResource(
    id: string,
    scope: CommonConstruct,
    props: MyServiceProps
  ) {
    if (!props) throw new Error(`MyService props undefined for ${id}`)

    const resourceName = scope.resourceNameFormatter.format(props.name)

    // Create the resource using CDK constructs
    // ...

    createCfnOutput(`${id}Arn`, scope, resourceArn)
    return resource
  }
}
```

### 3. Create the index file

```
packages/aws/src/services/my-service/index.ts
```

```typescript
export * from './main.js'
export * from './types.js'
```

### 4. Export from the services index

Add to `packages/aws/src/services/index.ts`:

```typescript
export * from './my-service/index.js'
```

### 5. Inject into CommonConstruct

Add to `packages/aws/src/common/construct.ts`:

```typescript
import { MyServiceManager } from '../services/index.js'

export class CommonConstruct extends Construct {
  myServiceManager: MyServiceManager

  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id)
    // ... existing managers
    this.myServiceManager = new MyServiceManager()
  }
}
```

### 6. Write tests

Create `packages/aws/test/services/my-service.test.ts` following existing test patterns.

## Adding a New Construct

### 1. Create the directory structure

```
packages/aws/src/construct/my-construct/
├── main.ts
├── types.ts
└── index.ts
```

### 2. Define props

```typescript
// types.ts
import { CommonStackProps } from '../../common/index.js'

/** @category Interface */
export interface MyConstructProps extends CommonStackProps {
  // construct-specific properties
}
```

### 3. Implement the construct

```typescript
// main.ts
import { CommonConstruct } from '../../common/index.js'
import { Construct } from 'constructs'
import { MyConstructProps } from './types.js'

/**
 * Provides a construct to create and deploy MyConstruct.
 * @example
 * ```
 * import { MyConstruct, MyConstructProps } from '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends MyConstruct {
 *   constructor(parent: Construct, id: string, props: MyConstructProps) {
 *     super(parent, id, props)
 *     this.initResources()
 *   }
 * }
 * ```
 * @category Construct
 */
export abstract class MyConstruct extends CommonConstruct {
  props: MyConstructProps

  protected constructor(parent: Construct, id: string, props: MyConstructProps) {
    super(parent, id, props)
    this.props = props
  }

  protected initResources() {
    // Resource creation pipeline
  }
}
```

### 4. Export and write tests

Follow the same pattern as service managers above.

## Code Conventions

### JSDoc Comments

Every exported class, interface, and enum must have:

- A description
- An `@example` block
- A `@category` tag (`Construct`, `Service`, `Common`, `Interface`, `Enum`, or `Constant`)

### Error Handling

Always validate props at the start of service manager methods:

```typescript
if (!props) throw new Error(`Props undefined for ${id}`)
if (!props.name) throw new Error(`Name undefined for ${id}`)
```

### Resource Naming

Always use the formatter for resource names:

```typescript
const name = scope.resourceNameFormatter.format(props.name)
```

### CloudFormation Outputs

Use the `createCfnOutput` utility for important resource identifiers:

```typescript
import { createCfnOutput } from '../../utils/index.js'
createCfnOutput(`${id}Arn`, scope, resource.resourceArn)
```

## Pull Request Checklist

- [ ] New code has JSDoc comments with `@category` tags
- [ ] Props interface extends `CommonStackProps` (or cloud-specific equivalent)
- [ ] Error handling validates props
- [ ] Resource names use `ResourceNameFormatter`
- [ ] Tests cover the new functionality
- [ ] Exports added to relevant `index.ts` files
- [ ] Changeset created (`pnpm changeset`)
- [ ] `pnpm validate` passes (prettier + lint + tests)
