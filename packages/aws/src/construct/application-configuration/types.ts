import { CommonStackProps } from '../../common/index.js'
import { AppConfigProps } from '../../services/index.js'

/**
 * Properties for configuring an {@link ApplicationConfiguration} construct
 */
/** @category Interface */
export interface ApplicationConfigurationProps extends CommonStackProps {
  /** The AppConfig application, environment, and profile configuration */
  appConfig: AppConfigProps
  /** The JSON content for the hosted configuration version */
  appConfigContent: any
}
