import { processEvent } from '../lib/lambda'

const validEvent = require('./testEvent.json')

const response = processEvent(validEvent)
const error = () => processEvent(undefined)

describe('TestApiDestinedFunction', () => {
  test('handles valid event as expected', () => {
    expect(response).toHaveProperty('statusCode')
    expect(response).toHaveProperty('body')
  })

  test('processes valid event as expected', () => {
    expect(response).toEqual(
      expect.objectContaining({
        statusCode: 200,
        message: 'Webhook call successful',
        body: {
          payload: {
            body: {
              test: true,
            },
          },
        },
        origin: 'https://example.gradientedge.io',
        source: 'custom:api-destined-lambda',
        httpMethod: 'POST',
        path: '/notification',
        referer: 'https://example.gradientedge.io/',
        resource: '/',
        success: true,
      })
    )
  })
})

describe('TestApiDestinedFunction', () => {
  test('handles mis-configurations as expected', () => {
    expect(error).toThrow('Invalid Event')
  })
})
