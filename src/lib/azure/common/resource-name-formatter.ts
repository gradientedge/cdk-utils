import { Construct } from 'constructs'
import { AzureResourceNameFormatterProps } from './types'
import { CommonAzureStackProps } from './types'

interface ResourceFormatter {
  format(resourceName: string, options?: AzureResourceNameFormatterProps): string
}

interface FormatProps {
  globalPrefix?: string
  globalSuffix?: string
  resourcePrefix?: string
  resourceSuffix?: string
  stage: string
}

export class AzureNameFormatter implements ResourceFormatter {

  constructor(private props: FormatProps) {
  }

  public format(resourceName: string, options?: AzureResourceNameFormatterProps) {
    const azureResourceNameElements = []

    if (!options?.exclude) {
      azureResourceNameElements.push(options?.globalPrefix ? this.props.globalPrefix : undefined)
      azureResourceNameElements.push(options?.prefix ?? this.props.resourcePrefix)
    }

    azureResourceNameElements.push(resourceName)

    if (!options?.exclude) {
      azureResourceNameElements.push(options?.suffix ?? this.props.resourceSuffix)
      azureResourceNameElements.push(options?.globalSuffix ? this.props.globalSuffix : undefined)
    }

    azureResourceNameElements.push(this.props.stage)

    return azureResourceNameElements
      .filter(azureResourceNameElements => azureResourceNameElements != undefined)
      .join('-')
  }
}

export class AzureResourceNameFormatter extends Construct {
  props: CommonAzureStackProps
  formatter: ResourceFormatter

  constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
    super(parent, id)
    this.props = props
    this.formatter = new AzureNameFormatter(props)
  }

  /**
   * @summary Helper method to format azure resource name based on the provided options
   * @param resourceName The azure resource name to format
   * @param options Options to control the formatting of the resource name
   * @returns The formatted Azure-compliant resource name
   */
  public format(resourceName: string, options?: AzureResourceNameFormatterProps) {
    return this.formatter.format(resourceName, options)
  }
}
