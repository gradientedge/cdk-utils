import { Template } from 'aws-cdk-lib/assertions'
import { stringify } from 'yaml'
import fs from 'node:fs'

/**
 * Write a template to a file
 *
 * @param template - The template to write
 * @param format - The format to write the template in (json or yaml)
 * @param filename - The filename to write the template to
 */
const writeTemplate = (template: Template, format: 'json' | 'yaml' = 'json', filename: string = 'template') => {
  const content = format === 'yaml' ? stringify(template, null, 2) : JSON.stringify(template, null, 2)
  fs.writeFileSync(`${filename}.${format}`, content)
}

export { writeTemplate }
