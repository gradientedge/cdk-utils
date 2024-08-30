import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { ResourceNameFormatterProps } from '../../common'

export interface VpcProps extends ec2.VpcProps {
  isIPV6?: boolean
}
