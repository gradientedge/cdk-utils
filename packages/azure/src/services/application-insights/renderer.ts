import fs from 'node:fs'
import path from 'node:path'

import appRoot from 'app-root-path'
import { parse } from 'yaml'
import _ from 'lodash'

import { WorkbookRenderer } from './types.js'

export class AzureWorkbookRenderer implements WorkbookRenderer {
  readonly templatePath: string
  readonly outputDir: string

  constructor(basePath?: string, outputDir?: string) {
    this.templatePath = basePath ?? path.join(appRoot.path, 'template', 'workbook')
    this.outputDir = outputDir ?? path.join(appRoot.path, '.artifacts')
  }

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
