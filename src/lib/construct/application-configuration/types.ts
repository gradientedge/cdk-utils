import { CommonStackProps } from '../../common'
import { AppConfigProps } from '../../services'

export interface ApplicationConfigurationProps extends CommonStackProps {
  appConfig: AppConfigProps
  appConfigContent: any
}
