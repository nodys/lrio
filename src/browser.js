

module.exports = function(channel) {

  channel      = channel || 'default';
  var protocol = 'lrio-protocol-' + channel;
  var header   = 'X-Lrio-' + channel;

  var client    = {};
  var listeners = {};

  client.trigger = function (type, data) {
    listeners[type] = listeners[type] || [];
    listeners[type].forEach(function(listener) {
      listener.call(null, data)
    })
  }

  client.on = function (type, listener) {
    listeners[type] = listeners[type] || [];
    listeners[type].push(listener);
  }

  client.off = function (type, listener) {
    if(!listeners[type]) return;
    listeners[type] = listeners[type].filter(function(_listener) {
      return listener !== _listener
    })
  }

  function connectSocket() {
    var loc     = document.location;
    var remote  = (loc.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + loc.host + '/';
    var socket  = new WebSocket(remote, protocol)
    socket.onmessage = function(event) {
      var m = JSON.parse(event.data);
      client.trigger(m.type, m)
      client.trigger(m.type + ':' + m.uid, m.src)
    }
  }

  function ifServerExists(callback) {
    var req = new XMLHttpRequest()
    req.onreadystatechange = function () {
      if (req.readyState === 2
        && (req.getResponseHeader(header) == 'enabled')) {
        callback()
      }
    }
    req.open('HEAD', document.location, true)
    req.send(null)
  }

  try {
    ifServerExists(connectSocket)
  } catch(e) {}

  return client;

}
