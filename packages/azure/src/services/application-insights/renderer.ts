import fs from 'node:fs'
import path from 'node:path'

import appRoot from 'app-root-path'
import { parse } from 'yaml'
import _ from 'lodash'

import { WorkbookRenderer } from './types.js'

/**
 * Renders Azure Application Insights workbook templates from YAML to JSON
 * - Reads YAML templates from a configurable template directory
 * - Compiles templates using Lodash template interpolation
 * - Writes rendered JSON output to an artifacts directory
 * @category Service
 */
export class AzureWorkbookRenderer implements WorkbookRenderer {
  /** Absolute path to the directory containing workbook YAML templates */
  readonly templatePath: string
  /** Absolute path to the directory where rendered output files are written */
  readonly outputDir: string

  /**
   * @summary Create a new AzureWorkbookRenderer
   * @param basePath optional base path for workbook templates; defaults to '<appRoot>/template/workbook'
   * @param outputDir optional output directory for rendered files; defaults to '<appRoot>/.artifacts'
   */
  constructor(basePath?: string, outputDir?: string) {
    this.templatePath = basePath ?? path.join(appRoot.path, 'template', 'workbook')
    this.outputDir = outputDir ?? path.join(appRoot.path, '.artifacts')
  }

  /**
   * @summary Render a workbook template to a JSON file
   * @param filename the output filename slug (used as '<filename>-workbook.json')
   * @param templateId the template identifier to locate in the template directory
   * @param variables the variables to substitute into the template using Lodash interpolation
   * @returns the absolute path to the rendered output file
   */
  renderToFile(filename: string, templateId: string, variables: Record<string, string>): string {
    const templateFilePath = `${this.templatePath}/${templateId}.yaml`
    const templateContent = fs.readFileSync(templateFilePath, 'utf-8')
    const parsed = parse(templateContent)

    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g
    const compiled = _.template(parsed.template)
    const rendered = compiled(variables)

    const outputPath = path.join(this.outputDir, `${filename}-workbook.json`)
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, rendered, 'utf-8')

    return outputPath
  }
}
