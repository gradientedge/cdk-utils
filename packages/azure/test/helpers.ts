import * as pulumi from '@pulumi/pulumi'

export function outputToPromise<T>(output: pulumi.Output<T>): Promise<T> {
  return (output as unknown as { promise: (withUnknowns?: boolean) => Promise<T> }).promise(true)
}
