import appRoot from 'app-root-path'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { parse } from 'yaml'
import { TemplateError } from './error.js'
import { DashboardRenderer, MissingKeys, PaneTemplate, RenderParams } from './types.js'

export class AzureDashboardRenderer implements DashboardRenderer {
  private readonly paneTemplatePath: string
  private readonly outputDir: string

  constructor(basePath?: string, outputDir?: string) {
    this.paneTemplatePath = basePath ?? path.join(appRoot.path, 'template', 'dashboard')
    this.outputDir = outputDir ?? path.join(appRoot.path, '.artifacts')
  }

  private getPaneId(id: string): PaneTemplate {
    const panePath = `${this.paneTemplatePath}/${id}.yaml`
    const paneFileContent = fs.readFileSync(panePath, 'utf-8')
    const paneTemplate = parse(paneFileContent)
    return paneTemplate
  }

  public getMissingProperties(template: PaneTemplate, properties: RenderParams['properties'] = []): MissingKeys {
    const keys = Object.keys(template.properties).filter(key => !(key in properties))
    return {
      keys,
      hasMissingKeys: keys.length !== 0,
    }
  }

  public getMissingVariables(template: PaneTemplate, variables: RenderParams['variables']): MissingKeys {
    const keys = Object.keys(template.variables).filter(key => !(key in variables))
    return {
      keys,
      hasMissingKeys: keys.length !== 0,
    }
  }

  public render(params: RenderParams): string {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g

    // if client is used instead of hosts
    let partsIndex = 0
    let yIndex = 0
    const parts: Record<string, any> = {}
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
          parts[`${partsIndex}`] = part
          partsIndex++
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
      lenses: {
        '0': {
          order: 0,
          parts,
        },
      },
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
