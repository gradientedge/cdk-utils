---
'@gradientedge/cdk-utils-aws': patch
'@gradientedge/cdk-utils': patch
---

fix(site-with-lambda-backend): attach Function URL to the real Alias resource

`createSiteLambdaUrl` previously imported the alias-qualified function via
`Function.fromFunctionAttributes(functionArn:aliasName)`. That is a CDK
reference, not a real CFN resource, so `siteLambdaUrl.node.addDependency(lambdaFn)`
was a no-op in the synthesised template and `AWS::Lambda::Url` was created in
parallel with `AWS::Lambda::Alias`. On fresh-account first deploys the URL
would fire before the alias existed and Lambda's control plane returned
`Function does not exist (Status 404)`, cancelling the alias and rolling back
the stack.

Attach the URL directly to `lambdaFunction.lambdaAliases[aliasName]` — the
real `Alias` instance the lambda services manager stashes on the function.
CDK then emits a proper `DependsOn` between the URL and the Alias, closing
the race.
