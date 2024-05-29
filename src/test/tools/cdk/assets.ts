import { Source, ISource } from 'aws-cdk-lib/aws-s3-deployment'
import { AssetOptions } from 'aws-cdk-lib/aws-s3-assets'

const mapToBucketName = (values: Array<any>): Array<string> => {
  return values.map(() => 'bucket_name')
}

const s3AssetsMock = (path: string, _options?: AssetOptions): ISource => {
  const name = path.replace(/.*\//g, '')
  return {
    bind(): any {
      return {
        bucket: {
          bucketName: 'bucket_name',
        },
        zipObjectKey: `${name}.zip`,
      }
    },
  }
}

const s3AssetSpyInit = () => {
  let sourceAssetMock: jest.SpyInstance<ISource, [path: string, options?: AssetOptions], any>
  const s3AssetSpySetup = () => {
    sourceAssetMock = jest.spyOn(Source, 'asset').mockImplementation(s3AssetsMock)
  }
  const s3AssetSpyRestore = () => {
    sourceAssetMock!.mockRestore()
  }
  return { s3AssetSpySetup, s3AssetSpyRestore }
}

export { s3AssetSpyInit, s3AssetsMock, mapToBucketName }
