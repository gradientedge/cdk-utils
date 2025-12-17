import { CommonStackProps } from '../../common/index.js'
import { AppConfigProps } from '../../services/index.js'

export interface ApplicationConfigurationProps extends CommonStackProps {
  appConfig: AppConfigProps
  appConfigContent: any
}
