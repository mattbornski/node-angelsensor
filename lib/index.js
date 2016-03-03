var noble = require('noble')
var sensor = require('./sensor')

var connect = function(uuid, callback) {
  var device = new sensor.Sensor(uuid)
  if (callback) {
    callback(null, device)
  }
  return device
}

module.exports = {
  scan: sensor.scan,
  connect: connect,
}
