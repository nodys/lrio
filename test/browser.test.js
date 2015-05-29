/* global describe it before */
var expect = require('expect.js')

var jsdom = require('jsdom')
var browserify = require('browserify')
var concatStream = require('concat-stream')
var join = require('path').join

describe('lrio', function () {
  describe('browser', function () {
    var bBundle

    before(function (done) {
      var b = browserify()
      var lrio = process.env.COVERAGE ? join(__dirname, '../src-cov/browser.js') : join(__dirname, '../src/browser.js')
      b.require(lrio, {
        expose: 'lrio'
      })
      b.bundle().pipe(concatStream(function (result) {
        bBundle = result.toString()
        done()
      }))
    })

    function readJsdomError (errors) {
      var msg = errors.reduce(function (memo, item) {
        memo += item.type + ' ' + item.message + ':\n  ' + item.data.error.message
        return memo
      }, '')
      return new Error(msg)
    }

    function mockXMLHttpRequest (forChannel) {
      return function () {
        var self = this
        self.readyState = 2
        self.getResponseHeader = function (header) {
          if (header === 'X-Lrio-' + forChannel) return 'enabled'
        }
        self.open = function () {}
        self.send = function () {
          self.onreadystatechange()
        }
      }
    }

    function mockWebSocket () {
      function mock (remote, protocol) {
        mock.sockets[protocol] = this
      }
      mock.sockets = {}
      return mock
    }

    function watchClient (client) {
      var result = {
        eventCalled: [],
        message: null,
        unwatch: function () {
          client.off('message', onmessage)
          client.off('error', onerror)
          client.off('open', onopen)
          client.off('close', onclose)
        }
      }
      function onmessage (_message) {
        result.eventCalled.push('message')
        result.message = _message
      }
      function onerror () {
        result.eventCalled.push('error')
      }
      function onopen () {
        result.eventCalled.push('open')
      }
      function onclose () {
        result.eventCalled.push('close')
      }

      client.on('message', onmessage)
      client.on('error', onerror)
      client.on('open', onopen)
      client.on('close', onclose)
      return result
    }

    it('should listen for server messages on the given channel', function (done) {
      var channel = 'myChannel'
      jsdom.env({
        'html': '<html></html>',
        'src': [bBundle],
        'created': function (errors, window) {
          if (errors && errors.length) {
            return done(readJsdomError(errors))
          }
          window.XMLHttpRequest = mockXMLHttpRequest('myChannel')
          window.WebSocket = mockWebSocket()
          // console.log('jscov ?', global['_$jscoverage'])
          if (typeof (global['_$jscoverage']) !== 'undefined') {
            window['_$jscoverage'] = global['_$jscoverage']
          }
        },
        'done': function (errors, window) {
          if (errors && errors.length) {
            return done(readJsdomError(errors))
          }

          var client1 = window.require('lrio')(channel)
          var watch1 = watchClient(client1)

          var client2 = window.require('lrio')('anotherChannel')
          var watch2 = watchClient(client2)

          var socket1 = window.WebSocket.sockets['lrio-protocol-myChannel']
          var socket2 = window.WebSocket.sockets['lrio-protocol-anotherChannel']

          socket1.onopen()
          socket1.onmessage({
            data: JSON.stringify({
              myData: '42'
            })
          })
          socket1.onclose()
          try {
            socket1.onerror() // Mocha now detect an error...
          } catch(e) {}

          // Test client.off(event, listener) : see watchClient()
          watch1.unwatch()
          socket1.onmessage({
            data: JSON.stringify({
              myData: '42'
            })
          })

          expect(watch1.message).to.eql({
            myData: '42'
          })
          expect(watch1.eventCalled).to.eql([
            'open',
            'message',
            'close',
            'error'
          ])

          // Socket2 (anotherChannel) must not even be created
          // (the mockXMLHttpRequest accept only myChannel)
          expect(socket2).not.to.eql(undefined)
          expect(watch2.message).to.eql(null)
          expect(watch2.eventCalled).to.eql([])

          done()
        }
      })
    })

  })

})
