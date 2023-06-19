import { AccessPointOptions, FileSystemProps } from 'aws-cdk-lib/aws-efs'
import { AuthorizationConfig } from 'aws-cdk-lib/aws-ecs'

/**
 * @category cdk-utils.efs-manager
 * @subcategory Properties
 */
export interface EfsFileSystemProps extends FileSystemProps {
  provisionNewOnDeployment?: boolean
  rootDirectory?: string
  transitEncryption?: string
  transitEncryptionPort?: number
  authorizationConfig?: AuthorizationConfig
}

/**
 * @category cdk-utils.efs-manager
 * @subcategory Properties
 */
export interface EfsAccessPointOptions extends AccessPointOptions {}
