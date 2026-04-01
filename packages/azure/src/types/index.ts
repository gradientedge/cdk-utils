import * as pulumi from '@pulumi/pulumi'
export interface BaseAzureConfigProps {
  resourceGroupName: pulumi.Input<string>
}
