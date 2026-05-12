import { AuthorizationConfig } from 'aws-cdk-lib/aws-ecs'
import { AccessPointOptions, FileSystemProps } from 'aws-cdk-lib/aws-efs'

/**
 * Properties for creating an EFS file system.
 * @see {@link FileSystemProps}
 */
/** @category Interface */
export interface EfsFileSystemProps extends FileSystemProps {
  /** Optional ECS authorization configuration for mounting the file system */
  authorizationConfig?: AuthorizationConfig
  /** When true, appends a timestamp to the logical ID to force replacement on each deployment */
  provisionNewOnDeployment?: boolean
  /** Optional root directory path for the file system mount */
  rootDirectory?: string
  /** Optional transit encryption mode for data in transit */
  transitEncryption?: string
  /** Optional port number for transit encryption */
  transitEncryptionPort?: number
}

/**
 * Options for creating an EFS access point.
 * @see {@link AccessPointOptions}
 */
/** @category Interface */
export interface EfsAccessPointOptions extends AccessPointOptions {}
