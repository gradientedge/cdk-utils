exports.handler = async function (event, context, callback) {
  console.debug(`Event: ${JSON.stringify(event)}`)
  console.debug(`Context: ${JSON.stringify(context)}`)
  return callback(null, { statusCode: 200 })
}
