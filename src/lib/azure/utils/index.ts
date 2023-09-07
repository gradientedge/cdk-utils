import { TerraformOutput } from 'cdktf'
import _ from 'lodash'
import { CommonAzureConstruct } from '../common'

export const createTfOutput = (
  id: string,
  scope: CommonAzureConstruct,
  value?: string,
  description?: string,
  sensitive?: boolean,
  overrideId = true
) => {
  const output = new TerraformOutput(scope, id, {
    description,
    sensitive,
    value,
  })

  if (overrideId) {
    output.overrideLogicalId(_.camelCase(id))
  }
  return output
}
