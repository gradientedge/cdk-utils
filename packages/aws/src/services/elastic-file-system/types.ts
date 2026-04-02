import { AuthorizationConfig } from 'aws-cdk-lib/aws-ecs'
import { AccessPointOptions, FileSystemProps } from 'aws-cdk-lib/aws-efs'

/**
 */
/** @category Interface */
export interface EfsFileSystemProps extends FileSystemProps {
  authorizationConfig?: AuthorizationConfig
  provisionNewOnDeployment?: boolean
  rootDirectory?: string
  transitEncryption?: string
  transitEncryptionPort?: number
}

/**
 */
/** @category Interface */
export interface EfsAccessPointOptions extends AccessPointOptions {}
