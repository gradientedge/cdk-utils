import fs from 'fs'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AzureWorkbookRenderer } from '../../src/services/application-insights/renderer.js'

describe('AzureWorkbookRenderer', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join('/tmp', 'workbook-renderer-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  test('constructor uses default paths when no arguments', () => {
    const renderer = new AzureWorkbookRenderer()
    expect(renderer).toBeDefined()
  })

  test('constructor uses provided paths', () => {
    const renderer = new AzureWorkbookRenderer('/custom/path', '/custom/output')
    expect(renderer).toBeDefined()
  })

  describe('renderToFile', () => {
    test('renders template to file and creates output directory', () => {
      const templateDir = path.join(tmpDir, 'templates')
      const outputDir = path.join(tmpDir, 'output')
      fs.mkdirSync(templateDir, { recursive: true })

      const templateContent = `template: '{"version":"Notebook/1.0","items":[{"name":"{{name}}"}]}'`
      fs.writeFileSync(path.join(templateDir, 'test-template.yaml'), templateContent)

      const renderer = new AzureWorkbookRenderer(templateDir, outputDir)
      const filePath = renderer.renderToFile('test-workbook', 'test-template', { name: 'test-value' })

      expect(filePath).toBe(path.join(outputDir, 'test-workbook-workbook.json'))
      expect(fs.existsSync(filePath)).toBe(true)
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toContain('test-value')
    })

    test('renders template with no variables', () => {
      const templateDir = path.join(tmpDir, 'templates')
      const outputDir = path.join(tmpDir, 'output')
      fs.mkdirSync(templateDir, { recursive: true })

      const templateContent = `template: '{"version":"Notebook/1.0","items":[]}'`
      fs.writeFileSync(path.join(templateDir, 'simple-template.yaml'), templateContent)

      const renderer = new AzureWorkbookRenderer(templateDir, outputDir)
      const filePath = renderer.renderToFile('simple-workbook', 'simple-template', {})

      expect(fs.existsSync(filePath)).toBe(true)
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toContain('Notebook/1.0')
    })

    test('renders to file when output directory already exists', () => {
      const templateDir = path.join(tmpDir, 'templates')
      const outputDir = path.join(tmpDir, 'existing-output')
      fs.mkdirSync(templateDir, { recursive: true })
      fs.mkdirSync(outputDir, { recursive: true })

      const templateContent = `template: '{"version":"Notebook/1.0","items":[]}'`
      fs.writeFileSync(path.join(templateDir, 'existing-template.yaml'), templateContent)

      const renderer = new AzureWorkbookRenderer(templateDir, outputDir)
      const filePath = renderer.renderToFile('existing-test', 'existing-template', {})

      expect(fs.existsSync(filePath)).toBe(true)
    })
  })
})
