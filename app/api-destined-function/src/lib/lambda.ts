import { v4 as uuidv4 } from 'uuid'

export const processEvent = (event: any) => {
  if (!event) throw new Error('Invalid Event')

  return {
    statusCode: 200,
    id: uuidv4(),
    message: 'Webhook call successful',
    body: {
      event: event,
    },
    origin: event.headers?.origin,
    source: 'custom:api-destined-lambda',
    sourceId: process.env.SOURCE_ID,
    httpMethod: event.httpMethod,
    path: event.path,
    referer: event.headers?.referer,
    resource: event.resource,
    success: true,
  }
}

exports.handler = async (event: any, context: any, callback: any) => {
  console.log('Event:', JSON.stringify(event))
  console.log('Context:', JSON.stringify(context))
  console.log('Event Records:', JSON.stringify(event.Records))
  return callback(null, processEvent(event))
}
