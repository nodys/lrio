/* global describe it */
var expect = require('expect.js')
var lrio = (process.env.COVERAGE ? require('../src-cov/server.js') : require('../src/server.js'))
var EventEmitter = require('events').EventEmitter

describe('lrio', function () {
  describe('server', function () {
    it('should be connected to an http(s) server', function () {
      var listeners = {}
      var mockServer = {
        on: function (type, listener) {
          listeners[type] = listener
        }
      }
      var lrServer = lrio(mockServer)
      expect(lrServer).to.have.keys('broadcast')
      expect(lrServer).to.have.keys('wsServer')
      expect(lrServer).to.have.keys('getClients')
      expect(listeners).to.have.keys('upgrade')
    })

    it('should accept client and broadcast messages', function () {
      var mockServer = new EventEmitter()
      var lrServer = lrio(mockServer)
      var rejected = false
      var accepted = false
      var protocol, origin, closeListener, message

      var mockRequest = {
        requestedProtocols: ['lrio-protocol-default'],
        origin: '--origin--',
        reject: function () {
          rejected = true
        },
        accept: function (_protocol, _origin) {
          protocol = _protocol
          origin = _origin
          accepted = true

          // Return mock connection
          return mockConnection
        }
      }

      var mockConnection = {
        remoteAddress: '--remote--',
        sendUTF: function (_message) {
          message = _message
        },
        on: function (type, listener) {
          if (type === 'close') {
            closeListener = listener
          }
        }
      }

      lrServer.wsServer.emit('request', mockRequest)

      expect(rejected).to.be(false)
      expect(accepted).to.be(true)
      expect(protocol).to.eql('lrio-protocol-default')
      expect(origin).to.eql('--origin--')

      // Expect client to contain the mocked client ():
      expect(lrServer.getClients()).to.contain(mockConnection)

      // Broadcast a change:
      lrServer.broadcast({type: 'change', uid: 'myUid', src: 'mySrc'})
      expect(message).to.be.eql(JSON.stringify({type: 'change', uid: 'myUid', src: 'mySrc'}))

      // Client close connection:
      closeListener()
      expect(lrServer.getClients()).not.to.contain(mockConnection)

    })

    it('should ignore from other protocols', function () {
      var mockServer = new EventEmitter()
      var lrServer = lrio(mockServer)
      var rejected = false
      var accepted = false

      var mockRequest = {
        requestedProtocols: ['other-protocol'],
        reject: function () {
          rejected = true
        },
        accept: function (_protocol, _origin) {
          console.log('Accepted')
          accepted = true
        }
      }

      lrServer.wsServer.emit('request', mockRequest)

      expect(rejected).to.be(false)
      expect(accepted).to.be(false)

    })

    it('should reject invalid client', function () {
      var mockServer = new EventEmitter()

      function validateClient (client) {
        return false
      }

      var lrServer = lrio(mockServer, null, validateClient)
      var rejected = false
      var accepted = false

      var mockRequest = {
        requestedProtocols: ['lrio-protocol-default'],
        reject: function () {
          rejected = true
        },
        accept: function (_protocol, _origin) {
          accepted = true
        }
      }

      lrServer.wsServer.emit('request', mockRequest)

      expect(rejected).to.be(true)
      expect(accepted).to.be(false)

    })

  })

})
