var Debug = require('debug')
var WebSocketServer = require('websocket').server
var EventEmitter = require('events').EventEmitter

/**
 * Attach a lrio server to a http(s) server
 *
 * Exemple:
 *
 *    var lrio       = require('lrio')
 *    var http       = require('http')
 *    var server     = http.createServer(myServerApplication)
 *    var myChannel  = lrio(server,'myChannel')
 *    server.listen(8080)
 *
 *    myChannel.broadcast({data:42})
 *
 *    myChannel.getClients().forEach(function(client) { ... })
 *
 * @param  {http.Server|https.Server} server
 *         A node http(s) server instance
 *
 * @param  {String} [channel]
 *         Optional channel name (used as websocket protocol
 *         and server validation)
 *
 * @param  {Function} [validateClient]
 *         Optional websocket request validator, request is rejected
 *         if the returned value is false
 *
 * @return {Object}
 *         An EventEmitter object with:
 *
 *         - `broadcast` {Function}: Broadcast something to all active clients
 *         - `getClients` {Function}: Get all active clients
 *         - `wsServer` {WebSocketServer}: The WebSocketServer instance
 *
 *         Events:
 *
 *         - `join` : When a client is accepted (argument: client's  WebSocketConnection instance)
 *         - `leave` : When a client is closed (argument: client's WebSocketConnection instance)
 *
 *         Other event may be attached to the WebSocketServer instance or the
 *         WebSocketConnection instances (see https://github.com/Worlize/WebSocket-Node)
 */
module.exports = function (server, channel, validateClient) {
  var ctrl = new EventEmitter()
  ctrl.channel = channel || 'default'
  ctrl.protocol = 'lrio-protocol-' + ctrl.channel
  ctrl.wsServer = new WebSocketServer({httpServer: server, autoAcceptConnections: false })
  ctrl.clients = []
  var debug = Debug('lrio:' + ctrl.channel)

  validateClient = validateClient || function () { return true }

  debug('connect to server on channel %s', channel)

  ctrl.wsServer.on('request', function (request) {
    if (!~request.requestedProtocols.indexOf(ctrl.protocol)) {
      return
    }

    if (!validateClient(request)) {
      return request.reject()
    }

    var connection = request.accept(ctrl.protocol, request.origin)
    ctrl.clients.push(connection)
    debug('ws: Peer connected %s', connection.remoteAddress)
    ctrl.emit('join', connection)

    connection.on('close', function (reasonCode, description) {
      ctrl.clients = ctrl.clients.filter(function (client) {
        return client !== connection
      })
      debug('ws: Peer disconnected %s', connection.remoteAddress)
      ctrl.emit('leave', connection)
    })
  })

  ctrl.broadcast = function (data) {
    var message = JSON.stringify(data)
    ctrl.clients.forEach(function (client) {
      client.sendUTF(message)
    })
  }

  ctrl.getClients = function () {
    return ctrl.clients
  }

  return ctrl
}
