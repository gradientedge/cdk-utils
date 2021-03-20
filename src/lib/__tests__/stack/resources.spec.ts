import * as cdk from '@aws-cdk/core'
import { expect } from '@jest/globals'
import { SynthUtils } from '@aws-cdk/assert'
import '@aws-cdk/assert/jest'
import * as common from '../../index'

const validStackProps: common.CommonStackProps = {
  stackName: 'common-stack',
  name: 'common-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stage: 'dev',
}

test('valid provisioning of common construct', () => {
  const stack = new cdk.Stack()
  new common.CommonConstruct(stack, 'CommonConstruct', validStackProps)

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
})
