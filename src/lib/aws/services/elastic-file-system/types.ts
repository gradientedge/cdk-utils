import { AuthorizationConfig } from 'aws-cdk-lib/aws-ecs'
import { AccessPointOptions, FileSystemProps } from 'aws-cdk-lib/aws-efs'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface EfsFileSystemProps extends FileSystemProps {
  authorizationConfig?: AuthorizationConfig
  provisionNewOnDeployment?: boolean
  rootDirectory?: string
  transitEncryption?: string
  transitEncryptionPort?: number
}

/**
 */
export interface EfsAccessPointOptions extends AccessPointOptions {}
