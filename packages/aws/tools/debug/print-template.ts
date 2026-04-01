import { Template } from 'aws-cdk-lib/assertions'
import { stringify } from 'yaml'

/**
 * Print a template to the console in the specified format
 *
 * @param template - The template to print
 * @param format - The format to print the template in (json or yaml)
 */
const printTemplate = (template: Template, format: 'json' | 'yaml' = 'json') => {
  if (format === 'yaml') {
    console.log(stringify(template, null, 2))
  } else {
    console.log(JSON.stringify(template, null, 2))
  }
}

export { printTemplate }
