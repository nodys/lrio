var debug            = require('debug')('lrio')
var WebSocketServer  = require('websocket').server;

module.exports = function(server, channel) {

  channel      = channel || 'default';
  var protocol = 'lrio-protocol-' + channel;
  var header   = 'X-Lrio-' + channel;

  var wsServer = new WebSocketServer({ httpServer: server, autoAcceptConnections: false })
  var clients  = [];

  function checkRequest(request) {
    if(request.requestedProtocols[0] != protocol) return false;
    return true;
  }

  wsServer.on('request', function(request) {
    if (!checkRequest(request)) {
      debug('ws: reject request %s', request.origin)
      return request.reject();
    }
    var connection = request.accept(protocol, request.origin);
    debug('ws: Peer connected %s', connection.remoteAddress)
    clients.push(connection);

    connection.on('close', function(reasonCode, description) {
      clients = clients.filter(function(client) {
        return client !== connection;
      })
      debug('ws: Peer disconnected %s', connection.remoteAddress)
    })
  })

  function broadcast(type, uid, src) {
    var message = JSON.stringify({type: type, uid: uid, src: src})
    clients.forEach(function(client) {
      client.sendUTF(message);
    })
  }

  server.on('request', function(req, res) {
    if(req.method != 'HEAD' || res.headersSent) return;
    res.setHeader(header, 'enabled')
  })

  return {
    broadcast: broadcast,
    wsServer:  wsServer,
    getClients: function() {
      return clients;
    }
  }
}
