exports.lambda_handler = async function (event: any, context: any, callback: any) {
  console.debug(`Event: ${JSON.stringify(event)}`)
  console.debug(`Context: ${JSON.stringify(context)}`)
  return callback(null, { statusCode: 200 })
}
