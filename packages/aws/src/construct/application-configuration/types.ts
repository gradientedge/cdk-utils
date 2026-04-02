import { CommonStackProps } from '../../common/index.js'
import { AppConfigProps } from '../../services/index.js'

/** @category Interface */
export interface ApplicationConfigurationProps extends CommonStackProps {
  appConfig: AppConfigProps
  appConfigContent: any
}
