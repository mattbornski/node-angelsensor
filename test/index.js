var assert = require('assert')
var angelsensor = require('../lib/index')
var events = require('events')
var noble = require('noble')
var sinon = require('sinon')

describe('connect', function() {
  it('should return an object', function(done) {
    var mockedPeripheral = {
      uuid: 'foo'
    }
    mockedPeripheral.__proto__ = events.EventEmitter.prototype
    mockedPeripheral.connect = function () {}

    var returned = angelsensor.connect('foo')
    noble.emit('discover', mockedPeripheral)
    done()
  })
})