# Gradient Edge AWS utils

An easy-to-use toolkit for working with the AWS CDK Toolkit:
https://docs.commercetools.com/api/authorization.

For more details, see our full [API documentation](https://gradientedge.github.io/commercetools-utils/).

## Installation

With **npm**:
```shell
npm install --save @gradientedge/common-aws
```

With **yarn**:
```shell
yarn add @gradientedge/common-aws
```

## Code examples

For clarity, we use the term **grant** to describe the object that holds the access token,
refresh token, scope and expiry details.

### Creating a client grant

```typescript
import { Region, CommercetoolsAuth, CommercetoolsGrant } from '@gradientedge/commercetools-utils'

async function example() {
  const auth = new CommercetoolsAuth({
    projectKey: 'your-project-key',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    region: Region.EUROPE_WEST,
    clientScopes: ['create_anonymous_token']
  })

  let grant: CommercetoolsGrant
  
  try {
    const grant = await auth.getClientGrant()
    console.log('Grant:', grant)
  } catch (error) {
    // 'error' will likely be an instance of CommercetoolsError.
    // See the API for full details.
    console.error(error)
    throw error
  }
}

example()
```

### Logging in a customer

```typescript
import { Region, CommercetoolsAuth, CommercetoolsGrant } from '@gradientedge/commercetools-utils'

async function example() {
  const auth = new CommercetoolsAuth({
    projectKey: 'your-project-key',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    region: Region.EUROPE_WEST,
    clientScopes: ['create_anonymous_token']
  })

  let grant: CommercetoolsGrant
  
  try {
    const grant = await auth.login({
      username: 'myUsername',
      password: 'myPassword'
    })
    console.log('Grant:', grant)
  } catch (error) {
    console.error(error)
    throw error
  }
}

example()
```

Note that the `getClientGrant` method here could be swapped out for say, `login`, in order to login a customer.
There is no need to call `getClientGrant` before calling `login`. Ensuring that there's an active client grant
will be taken care of by the `CommercetoolsAuth` class.

### Get an anonymous customer grant

```typescript
import { Region, CommercetoolsAuth, CommercetoolsGrant } from '@gradientedge/commercetools-utils'

async function example() {
  const auth = new CommercetoolsAuth({
    projectKey: 'your-project-key',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    region: Region.EUROPE_WEST,
    clientScopes: ['create_anonymous_token']
  })

  let grant: CommercetoolsGrant
  
  try {
    const grant = await auth.getAnonymousGrant()
    console.log('Grant:', grant)
  } catch (error) {
    console.error(error)
    throw error
  }
}

example()
```

### Refresh an existing customer grant

The code below demonstrates how we can call the `refreshCustomerGrant` method with the `refreshToken` of an
existing grant. Realistically, that grant would probably have come from something like a JWT that was passed
to your back-end server by your UI.

```typescript
import { Region, CommercetoolsAuth, CommercetoolsGrant } from '@gradientedge/commercetools-utils'

async function example() {
  const auth = new CommercetoolsAuth({
    projectKey: 'your-project-key',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    region: Region.EUROPE_WEST,
    clientScopes: ['create_anonymous_token']
  })

  let grant: CommercetoolsGrant

  try {
    const grant = await auth.login({
      username: 'myUsername',
      password: 'myPassword'
    })
    console.log('Grant:', grant)
  } catch (error) {
    console.error(error)
    throw error
  }
  
  // The 'grant' would have been   
  const refreshToken = grant.refreshToken  
  try {
    const grant = await auth.refreshCustomerGrant(refreshToken)
    console.log('Refreshed grant:', grant)
  } catch (error) {
    console.error(error)
    throw error
  }
}

example()
```
