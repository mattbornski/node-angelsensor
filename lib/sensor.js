var bt = require('./bt')
var events = require('events')
var noble = require('noble')
var util = require('./util')

var startScanning = function() {
  noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
      noble.startScanning()
    } else {
      noble.stopScanning()
    }
  })
}

var _reconnect = function(uuid) {
  console.log('reconnect to ' + uuid)
  var checkFoundDevice = function(device) {
    if ((this.reconnect || !this.device) && device.uuid == uuid) {
      noble.removeListener('discover', checkFoundDevice)
      this._found(device)
    }
  }.bind(this)
  
  noble.on('discover', checkFoundDevice)

  startScanning()
}

var _found = function(device) {
  this.device = device

  this.device.on('disconnect', function() {
    console.log('disconnected!')
    this._reconnect(this.device.uuid)
  }.bind(this))

  this.device.connect()
}

var debug = function() {
  var inventoried = false
  console.log('monitoring your angel sensor!')
  this.peripheral.on('connect', function() {
    console.log('connected!')

    if (!inventoried) {
      inventoried = true
      bt.debugInventoryServicesAndCharacteristics(this.peripheral, function(error) {
        if (error) {
          console.log(error)
        }
        bt.debugSubscribe(this.peripheral)
      }.bind(this))
    } else {
      bt.debugSubscribe(this.peripheral)
    }
  }.bind(this))
}

function Sensor(device) {
  this.reconnect = true

  events.EventEmitter.call(this)

  this.on('newListener', function() {
    console.log('have a new listener')
  }.bind(this))

  // Instance methods
  this.debug = debug
  this._found = _found
  this._reconnect = _reconnect

  if (device) {
    if (util.isString(device)) {
      // UUID
      this._reconnect(device)
    } else {
      // Noble library representation
      this._found(device)
    }
  }
}
Sensor.prototype.__proto__ = events.EventEmitter.prototype



var scan = function(rediscover, callback) {
  startScanning()

  var found = {}
  noble.on('discover', function(peripheral) {
    if ((peripheral.advertisement.localName || '').match(/Angel Sensor/)) {
      if (rediscover || !found[peripheral.uuid]) {
        var device = new sensor.Sensor(peripheral)
        console.log('Found ' + peripheral.advertisement.localName)
        found[peripheral.uuid] = true
        callback(null, device)
      }
    }
  })
}



module.exports = {
  scan: scan,
  Sensor: Sensor,
}
