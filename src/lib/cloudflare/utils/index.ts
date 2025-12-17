import { TerraformOutput } from 'cdktf'
import _ from 'lodash'
import { CommonCloudflareConstruct } from '../common/index.js'

export const createCloudflareTfOutput = (
  id: string,
  scope: CommonCloudflareConstruct,
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
