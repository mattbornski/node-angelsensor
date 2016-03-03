var async = require('async')
var noble = require('noble')
var util = require('./util')

SUPPLEMENTAL_ANGEL_SERVICE_NAMES = {
  '68b527384a0440e18f83337a29c3284d': 'Activity Monitoring',
  '7cd50edd8bab44ffa8e882e19393af10': 'Alarm Clock',
  '87ef07ff47394527b38fb0e228de6ed3': 'Health Journal',
  '902dcf38ccc04902b22c70cab5ee5df2': 'Blood Oxygen Saturation',
  '481d178c10dd11e4b514b2227cce2b54': 'Waveform Signal',
}

SUPPLEMENTAL_ANGEL_CHARACTERISTIC_NAMES = {
  '2b7c87288afb4be7b9eb35156a443b70': 'Activity Monitoring',
  '7a5433056b9e4878ad6729c5a9d99736': 'Step Count',
  '9e3bd0d7bdd841fdaf1f5e99679183ff': 'Acceleration Energy Magnitude',
  '2a38': 'Body Sensor Location',
  'd1b446fe13134fce9ae1d68ae2d29e60': 'Activity Monitoring Control Point',
  '72f442a76ecd48518858403f0a7cab73': 'Fall Detection',
  '3b8e7983133a4a0f90fc82006ed55505': 'Protocol Revision',
}

var getService = function(peripheral, serviceId, done) {
  peripheral.discoverServices([serviceId], function(error, services) {
    if (error) {
      return done('While getting services: ' + error)
    }
    var service = services[0]
    if (!service) {
      return done('no service found for ' + serviceId)
    }
    return done(null, service)
  })
}

var getCharacteristic = function(peripheral, serviceId, characteristicId, done) {
  if (util.isString(serviceId)) {
    getService(peripheral, serviceId, function(error, service) {
      if (error) {
        return done(error)
      }
      return getCharacteristic(peripheral, service, characteristicId, done)
    })
  } else {
    serviceId.discoverCharacteristics([characteristicId], function(error, characteristics) {
      if (error) {
        return done('While getting characteristics: ' + error)
      }
      var characteristic = characteristics[0]
      if (!characteristic) {
        return done('no characteristic found for ' + characteristicId)
      }
      return done(null, characteristic)
    })
  }
}

var debugCharacteristic = function(characteristic, done) {
  var characteristicName = characteristic.name || SUPPLEMENTAL_ANGEL_CHARACTERISTIC_NAMES[characteristic.uuid]
  console.log('  - ' + util.rpad(characteristic.uuid, 36) + characteristicName)
  return done()
}

var debugService = function(service, done) {
  var serviceName = service.name || SUPPLEMENTAL_ANGEL_SERVICE_NAMES[service.uuid]
  service.discoverCharacteristics(null, function(error, characteristics) {
    console.log(util.rpad(service.uuid, 40) + serviceName)
    async.eachSeries(characteristics, debugCharacteristic, function(error) {
      console.log()
      if (error) {
        return done(error)
      }
      return done()
    })
  })
}

var subscribe = function(peripheral, serviceId, characteristicId, callback, done) {
  console.log('Subscribing to ' + serviceId + ' ' + characteristicId)
  getService(peripheral, serviceId, function(error, service) {
    if (error) {
      return done('While getting service: ' + error)
    }

    getCharacteristic(peripheral, serviceId, characteristicId, function(error, characteristic) {
      if (error) {
        return done('While getting characteristic: ' + error)
      }
      characteristic.notify(true, function(error) {
        if (error) {
          return done('While subscribing: ' + error)
        }
        characteristic.on('read', callback)
        console.log('Notifications enabled for ' + serviceId + ' / ' + characteristicId + ': ' + service.name + ' / ' + characteristic.name)
        return done()
      })
    })
  })
}

var debugInventoryServicesAndCharacteristics = function(peripheral, done) {
  peripheral.discoverServices(null, function(error, services) {
    if (error) {
      return done(error)
    }
    console.log('discovered the following services:')
    async.eachSeries(services, debugService, done)
  })
}

var stepCount = function(data) {
  console.log('+ step count is now: ', data.readUInt24(0))
}

var heartRate = function(data) {
  console.log('+ heart rate is now: ', data.readUInt8(0))
}

var fallMonitoring = function(data) {
  console.log('+ fall: ' + data.readUInt8(0) + ' ' + data.readUInt16(8) + ' seconds ago')
}

var debugSubscribe = function(peripheral) {
  async.eachSeries([
    ['180d', '2a37', heartRate],
    ['68b527384a0440e18f83337a29c3284d', '7a5433056b9e4878ad6729c5a9d99736', stepCount],
    ['68b527384a0440e18f83337a29c3284d', '72f442a76ecd48518858403f0a7cab73', fallMonitoring],
  ], function(args, done) {
    subscribe(peripheral, args[0], args[1], args[2], done)
  }, function (error) {
    if (error) {
      console.log('error while subscribing')
      console.log(error)
    }
  })
}

module.exports = {
  debugInventoryServicesAndCharacteristics: debugInventoryServicesAndCharacteristics,
  debugSubscribe: debugSubscribe,
}
