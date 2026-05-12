import fs from 'fs'
import path from 'path'

import appRoot from 'app-root-path'
import _ from 'lodash'
import { parse } from 'yaml'

import { TemplateError } from './error.js'
import { DashboardRenderer, MissingKeys, PaneTemplate, RenderParams } from './types.js'

/**
 * Renders Azure Portal dashboard templates from YAML pane definitions into JSON
 * - Reads pane templates from a configurable template directory
 * - Compiles templates using Lodash template interpolation with `{{}}` delimiters
 * - Validates required variables and properties before rendering
 * - Assembles multiple panes into a single dashboard JSON structure
 * @category Service
 */
export class AzureDashboardRenderer implements DashboardRenderer {
  /** Absolute path to the directory containing pane YAML templates */
  readonly paneTemplatePath: string
  /** Absolute path to the directory where rendered dashboard files are written */
  readonly outputDir: string

  /**
   * @summary Create a new AzureDashboardRenderer
   * @param basePath optional base path for pane templates; defaults to '<appRoot>/template/dashboard'
   * @param outputDir optional output directory for rendered files; defaults to '<appRoot>/.artifacts'
   */
  constructor(basePath?: string, outputDir?: string) {
    this.paneTemplatePath = basePath ?? path.join(appRoot.path, 'template', 'dashboard')
    this.outputDir = outputDir ?? path.join(appRoot.path, '.artifacts')
  }

  /**
   * @summary Load and parse a pane template by its identifier
   * @param id the pane template identifier (corresponds to a YAML filename without extension)
   * @returns the parsed pane template including dimensions, properties, variables, and template content
   */
  protected getPaneId(id: string): PaneTemplate {
    const panePath = `${this.paneTemplatePath}/${id}.yaml`
    const paneFileContent = fs.readFileSync(panePath, 'utf-8')
    const paneTemplate = parse(paneFileContent)
    return paneTemplate
  }

  /**
   * @summary Check for required properties that are missing from the render parameters
   * @param template the pane template defining required properties
   * @param properties the provided properties to check against the template
   * @returns an object indicating which required property keys are missing
   */
  public getMissingProperties(template: PaneTemplate, properties: RenderParams['properties'] = []): MissingKeys {
    const keys = Object.keys(template.properties ?? {}).filter(key => !(key in properties))
    return {
      keys,
      hasMissingKeys: keys.length !== 0,
    }
  }

  /**
   * @summary Check for required variables that are missing from the render parameters
   * @param template the pane template defining required variables
   * @param variables the provided variables to check against the template
   * @returns an object indicating which required variable keys are missing
   */
  public getMissingVariables(template: PaneTemplate, variables: RenderParams['variables']): MissingKeys {
    const keys = Object.keys(template.variables ?? {}).filter(key => !(key in variables))
    return {
      keys,
      hasMissingKeys: keys.length !== 0,
    }
  }

  /**
   * @summary Render a complete dashboard from multiple pane templates
   * @param params render parameters including panes, variables, properties, and optional filter settings
   * @returns the rendered dashboard JSON string
   * @throws {@link TemplateError} if required variables or properties are missing
   */
  public render(params: RenderParams): string {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g

    // if client is used instead of hosts
    let yIndex = 0
    const parts: any[] = []
    for (const pane of params.panes) {
      try {
        const paneTemplate = this.getPaneId(pane.id)
        const compiled = _.template(paneTemplate.template)

        function getValue(value: string | number): string | number {
          try {
            if (typeof value === 'number') {
              return value
            }

            if (value.includes(':')) {
              const [property, formatter] = value.split(':')
              const unformattedValue = _.get(params.properties, property)
              if (formatter === 'host') {
                const host = new URL(unformattedValue)
                const port = host.protocol.startsWith('https') ? '443' : '80'
                return `${host.host}:${port}`
              }

              return unformattedValue
            }

            return value
          } catch (e) {
            console.error('failed to process', value, 'with error', e)

            return ''
          }
        }

        const missingVariables = this.getMissingVariables(paneTemplate, params.variables)
        if (missingVariables.hasMissingKeys) {
          throw new TemplateError(
            `Failed to render pane ${pane.id}: Missing required variables [${missingVariables.keys.join(', ')}] for template substitution.`
          )
        }

        const paneProperties: Record<string, string | number | Array<string | number>> = {}
        for (const [key, value] of Object.entries(pane.properties ?? {})) {
          if (value === undefined || value === null) {
            continue
          }

          let resolvedValue: string | number | Array<string | number> = ''
          if (typeof value === 'string') {
            resolvedValue = getValue(value)
          }

          if (Array.isArray(value)) {
            resolvedValue = value.map(v => getValue(v))
          }

          paneProperties[key] = resolvedValue
        }

        const properties = { ...params.properties, yIndex, ...paneProperties }
        const missingProperties = this.getMissingProperties(paneTemplate, properties)
        if (missingProperties.hasMissingKeys) {
          throw new TemplateError(
            `Failed to render pane ${pane.id}: Missing required properties [${missingProperties.keys.join(', ')}] for template substitution.`
          )
        }
        const paneContent = compiled(properties)
        const paneJSON = JSON.parse(paneContent)
        const templateParts = paneJSON.parts

        for (const part of templateParts) {
          parts.push(part)
        }
        yIndex += paneTemplate.dimensions.height
      } catch (e) {
        if (TemplateError.isInstance(e)) {
          throw e
        }
        console.error('failed to render pane', pane.id, 'with error', e)
      }
    }

    const dashboard = {
      lenses: [
        {
          order: 0,
          parts,
        },
      ],
      metadata: {
        model: {
          timeRange: {
            value: {
              relative: {
                duration: 24,
                timeUnit: 1,
              },
            },
            type: 'MsPortalFx.Composition.Configuration.ValueTypes.TimeRange',
          },
          filterLocale: {
            value: params.filter?.locale ?? 'en-us',
          },
          filters: {
            value: {
              MsPortalFx_TimeRange: {
                model: {
                  format: params.filter?.timeFormat ?? 'utc',
                  granularity: params.filter?.timeGranularity ?? 'auto',
                  relative: params.filter?.timeRelative ?? '4h',
                },
                displayCache: {
                  name: 'UTC Time',
                  value: 'Past 4 hours',
                },
                filteredPartIds: [],
              },
            },
          },
        },
      },
    }

    return JSON.stringify(dashboard, null, 2)
  }

  /**
   * @summary Render a dashboard and write the output to a template file
   * @param filename the output filename (used as '<filename>.tftpl')
   * @param params render parameters including panes, variables, properties, and optional filter settings
   * @returns the absolute path to the rendered output file
   */
  renderToFile(filename: string, params: RenderParams): string {
    const templateOutput = this.render(params)
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
    const filePath = path.join(this.outputDir, `${filename}.tftpl`)
    fs.writeFileSync(filePath, templateOutput)

    return filePath
  }
}
