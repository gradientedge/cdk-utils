import { processEvent } from '../lib/lambda.js'

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
        body: {
          event: validEvent,
        },
        httpMethod: 'POST',
        message: 'Webhook call successful',
        origin: 'https://example.gradientedge.io',
        path: '/notification',
        referer: 'https://example.gradientedge.io/',
        resource: '/',
        source: 'custom:api-destined-lambda',
        statusCode: 200,
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
