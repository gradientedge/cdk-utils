import fs from 'fs'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { TemplateError } from '../../src/services/portal/error.js'
import { AzureDashboardRenderer } from '../../src/services/portal/renderer.js'

describe('TemplateError', () => {
  test('constructor sets name and message', () => {
    const error = new TemplateError('test error message')
    expect(error.name).toBe('TemplateError')
    expect(error.message).toBe('test error message')
    expect(error.isTemplateError).toBe(true)
  })

  test('is instance of Error', () => {
    const error = new TemplateError('test')
    expect(error instanceof Error).toBe(true)
  })

  test('isInstance returns true for TemplateError instances', () => {
    const error = new TemplateError('test')
    expect(TemplateError.isInstance(error)).toBe(true)
  })

  test('isInstance returns false for regular Error', () => {
    const error = new Error('test')
    expect(TemplateError.isInstance(error)).toBe(false)
  })

  test('isInstance returns false for non-Error objects', () => {
    expect(TemplateError.isInstance('string')).toBe(false)
    expect(TemplateError.isInstance(null)).toBe(false)
    expect(TemplateError.isInstance(undefined)).toBe(false)
    expect(TemplateError.isInstance(42)).toBe(false)
  })

  test('isInstance returns true for objects with isTemplateError flag', () => {
    const fakeError = { isTemplateError: true }
    expect(TemplateError.isInstance(fakeError)).toBe(true)
  })

  test('isInstance returns false for objects with isTemplateError=false', () => {
    const fakeError = { isTemplateError: false }
    expect(TemplateError.isInstance(fakeError)).toBe(false)
  })
})

describe('AzureDashboardRenderer', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join('/tmp', 'portal-renderer-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  test('constructor uses default paths when no arguments', () => {
    const renderer = new AzureDashboardRenderer()
    expect(renderer).toBeDefined()
  })

  test('constructor uses provided paths', () => {
    const renderer = new AzureDashboardRenderer('/custom/path', '/custom/output')
    expect(renderer).toBeDefined()
  })

  describe('getMissingProperties', () => {
    test('returns empty keys when all properties provided', () => {
      const renderer = new AzureDashboardRenderer()
      const template = {
        dimensions: { height: 4 },
        properties: { prop1: 'desc1', prop2: 'desc2' },
        variables: {},
        template: '',
      }
      const result = renderer.getMissingProperties(template, { prop1: 'val1', prop2: 'val2' } as any)
      expect(result.hasMissingKeys).toBe(false)
      expect(result.keys).toEqual([])
    })

    test('returns missing keys when some properties are absent', () => {
      const renderer = new AzureDashboardRenderer()
      const template = {
        dimensions: { height: 4 },
        properties: { prop1: 'desc1', prop2: 'desc2', prop3: 'desc3' },
        variables: {},
        template: '',
      }
      const result = renderer.getMissingProperties(template, { prop1: 'val1' } as any)
      expect(result.hasMissingKeys).toBe(true)
      expect(result.keys).toContain('prop2')
      expect(result.keys).toContain('prop3')
    })

    test('returns all keys when properties is empty/default', () => {
      const renderer = new AzureDashboardRenderer()
      const template = {
        dimensions: { height: 4 },
        properties: { prop1: 'desc1' },
        variables: {},
        template: '',
      }
      const result = renderer.getMissingProperties(template)
      expect(result.hasMissingKeys).toBe(true)
      expect(result.keys).toEqual(['prop1'])
    })
  })

  describe('getMissingVariables', () => {
    test('returns empty keys when all variables provided', () => {
      const renderer = new AzureDashboardRenderer()
      const template = {
        dimensions: { height: 4 },
        properties: {},
        variables: { var1: 'desc1', var2: 'desc2' },
        template: '',
      }
      const result = renderer.getMissingVariables(template, { var1: 'val1', var2: 'val2' })
      expect(result.hasMissingKeys).toBe(false)
      expect(result.keys).toEqual([])
    })

    test('returns missing keys when variables are absent', () => {
      const renderer = new AzureDashboardRenderer()
      const template = {
        dimensions: { height: 4 },
        properties: {},
        variables: { var1: 'desc1', var2: 'desc2' },
        template: '',
      }
      const result = renderer.getMissingVariables(template, { var1: 'val1' })
      expect(result.hasMissingKeys).toBe(true)
      expect(result.keys).toEqual(['var2'])
    })
  })

  describe('render', () => {
    test('renders dashboard with empty panes', () => {
      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [],
        variables: {},
        properties: {},
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts).toEqual({})
      expect(parsed.metadata.model.filterLocale.value).toBe('en-us')
      expect(parsed.metadata.model.filters.value.MsPortalFx_TimeRange.model.format).toBe('utc')
      expect(parsed.metadata.model.filters.value.MsPortalFx_TimeRange.model.granularity).toBe('auto')
      expect(parsed.metadata.model.filters.value.MsPortalFx_TimeRange.model.relative).toBe('4h')
    })

    test('renders dashboard with custom filter options', () => {
      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [],
        variables: {},
        properties: {},
        filter: {
          locale: 'en-gb',
          timeFormat: 'local',
          timeGranularity: '1h',
          timeRelative: '24h',
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.metadata.model.filterLocale.value).toBe('en-gb')
      expect(parsed.metadata.model.filters.value.MsPortalFx_TimeRange.model.format).toBe('local')
      expect(parsed.metadata.model.filters.value.MsPortalFx_TimeRange.model.granularity).toBe('1h')
      expect(parsed.metadata.model.filters.value.MsPortalFx_TimeRange.model.relative).toBe('24h')
    })

    test('renders dashboard with valid pane template', () => {
      // Create a minimal pane template YAML file
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
variables: {}
template: |
  {"parts": [{"position": {"x": 0, "y": {{yIndex}}}}]}
`
      fs.writeFileSync(path.join(tmpDir, 'test-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [{ id: 'test-pane' }],
        variables: {},
        properties: {},
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0']).toBeDefined()
      expect(parsed.lenses['0'].parts['0'].position.y).toBe(0)
    })

    test('throws TemplateError when variables are missing', () => {
      const paneYaml = `dimensions:
  height: 4
properties: {}
variables:
  requiredVar: "A required variable"
template: |
  {"parts": []}
`
      fs.writeFileSync(path.join(tmpDir, 'missing-vars-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      expect(() =>
        renderer.render({
          panes: [{ id: 'missing-vars-pane' }],
          variables: {},
          properties: {},
        })
      ).toThrow(TemplateError)
    })

    test('throws TemplateError when properties are missing', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  requiredProp: "A required property"
variables: {}
template: |
  {"parts": [{"value": "{{requiredProp}}"}]}
`
      fs.writeFileSync(path.join(tmpDir, 'missing-props-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      expect(() =>
        renderer.render({
          panes: [{ id: 'missing-props-pane' }],
          variables: {},
          properties: {},
        })
      ).toThrow(TemplateError)
    })

    test('handles pane rendering errors gracefully (non-TemplateError)', () => {
      // Create a pane template that will cause a generic error during rendering
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
variables: {}
template: |
  not valid json {{yIndex}}
`
      fs.writeFileSync(path.join(tmpDir, 'bad-json-pane.yaml'), paneYaml)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [{ id: 'bad-json-pane' }],
        variables: {},
        properties: {},
      })

      // Should not throw, but log an error
      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts).toEqual({})
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('renders pane with properties including null/undefined values', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
  myProp: "desc"
variables: {}
template: |
  {"parts": [{"position": {"x": 0, "y": {{yIndex}}, "value": "{{myProp}}"}}]}
`
      fs.writeFileSync(path.join(tmpDir, 'prop-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [
          {
            id: 'prop-pane',
            properties: {
              myProp: 'hello',
              ignoredNull: null as any,
              ignoredUndefined: undefined as any,
            },
          },
        ],
        variables: {},
        properties: {},
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0'].position.value).toBe('hello')
    })

    test('renders pane with array property values', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
  items: "desc"
variables: {}
template: |
  {"parts": [{"position": {"y": {{yIndex}}}, "items": "{{items}}"}]}
`
      fs.writeFileSync(path.join(tmpDir, 'array-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [
          {
            id: 'array-pane',
            properties: {
              items: ['a', 'b'] as any,
            },
          },
        ],
        variables: {},
        properties: {},
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0']).toBeDefined()
    })

    test('renders pane with array containing numeric values via getValue', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
  items: "desc"
variables: {}
template: |
  {"parts": [{"position": {"y": {{yIndex}}}, "items": "{{items}}"}]}
`
      fs.writeFileSync(path.join(tmpDir, 'num-array-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [
          {
            id: 'num-array-pane',
            properties: {
              items: [42, 'hello'] as any,
            },
          },
        ],
        variables: {},
        properties: {},
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0']).toBeDefined()
    })

    test('renders pane with host-formatted property via getValue', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
  hostValue: "A host value"
variables: {}
template: |
  {"parts": [{"position": {"y": {{yIndex}}}, "host": "{{hostValue}}"}]}
`
      fs.writeFileSync(path.join(tmpDir, 'host-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [
          {
            id: 'host-pane',
            properties: {
              hostValue: 'myUrl:host' as any,
            },
          },
        ],
        variables: {},
        properties: { myUrl: 'https://example.com/path' } as any,
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0'].host).toBe('example.com:443')
    })

    test('renders pane with http host-formatted property via getValue', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
  hostValue: "A host value"
variables: {}
template: |
  {"parts": [{"position": {"y": {{yIndex}}}, "host": "{{hostValue}}"}]}
`
      fs.writeFileSync(path.join(tmpDir, 'http-host-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [
          {
            id: 'http-host-pane',
            properties: {
              hostValue: 'myUrl:host' as any,
            },
          },
        ],
        variables: {},
        properties: { myUrl: 'http://example.com/path' } as any,
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0'].host).toBe('example.com:80')
    })

    test('renders pane with property referencing colon formatter but non-host', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
  otherVal: "some val"
variables: {}
template: |
  {"parts": [{"position": {"y": {{yIndex}}}, "val": "{{otherVal}}"}]}
`
      fs.writeFileSync(path.join(tmpDir, 'colon-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [
          {
            id: 'colon-pane',
            properties: {
              otherVal: 'myKey:other' as any,
            },
          },
        ],
        variables: {},
        properties: { myKey: 'some-value' } as any,
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0'].val).toBe('some-value')
    })

    test('getValue returns empty string on error in catch block', () => {
      const paneYaml = `dimensions:
  height: 4
properties:
  yIndex: "Y index"
  badHost: "bad host val"
variables: {}
template: |
  {"parts": [{"position": {"y": {{yIndex}}}, "host": "{{badHost}}"}]}
`
      fs.writeFileSync(path.join(tmpDir, 'bad-host-pane.yaml'), paneYaml)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [
          {
            id: 'bad-host-pane',
            properties: {
              badHost: 'nonExistent:host' as any,
            },
          },
        ],
        variables: {},
        properties: {} as any,
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0'].host).toBe('')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('increments yIndex for multiple panes', () => {
      const paneYaml = `dimensions:
  height: 5
properties:
  yIndex: "Y index"
variables: {}
template: |
  {"parts": [{"position": {"y": {{yIndex}}}}]}
`
      fs.writeFileSync(path.join(tmpDir, 'multi-pane.yaml'), paneYaml)

      const renderer = new AzureDashboardRenderer(tmpDir, tmpDir)
      const result = renderer.render({
        panes: [{ id: 'multi-pane' }, { id: 'multi-pane' }],
        variables: {},
        properties: {},
      })

      const parsed = JSON.parse(result)
      expect(parsed.lenses['0'].parts['0'].position.y).toBe(0)
      expect(parsed.lenses['0'].parts['1'].position.y).toBe(5)
    })
  })

  describe('renderToFile', () => {
    test('renders to file and creates output directory', () => {
      const outputDir = path.join(tmpDir, 'output')

      const renderer = new AzureDashboardRenderer(tmpDir, outputDir)
      const filePath = renderer.renderToFile('test-dashboard', {
        panes: [],
        variables: {},
        properties: {},
      })

      expect(filePath).toBe(path.join(outputDir, 'test-dashboard.tftpl'))
      expect(fs.existsSync(filePath)).toBe(true)
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.lenses).toBeDefined()
    })

    test('renders to file when output directory already exists', () => {
      const outputDir = path.join(tmpDir, 'existing-output')
      fs.mkdirSync(outputDir, { recursive: true })

      const renderer = new AzureDashboardRenderer(tmpDir, outputDir)
      const filePath = renderer.renderToFile('existing-test', {
        panes: [],
        variables: {},
        properties: {},
      })

      expect(fs.existsSync(filePath)).toBe(true)
    })
  })
})
