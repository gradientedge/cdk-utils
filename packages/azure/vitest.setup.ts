import * as pulumi from '@pulumi/pulumi'
import { afterAll } from 'vitest'

/**
 * Clear Pulumi's internal leak candidates tracking after all tests complete.
 * Without this, Pulumi's process exit handler reports leaked promises
 * in CI environments where worker processes exit before all internal
 * Pulumi promises have settled.
 */
afterAll(() => {
  pulumi.runtime.resetOptions('project', 'stack', -1, '', '', false, '')
})
