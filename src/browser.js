module.exports = function (channel, options) {
  channel = channel || 'default'
  var protocol = 'lrio-protocol-' + channel

  var client = {}
  var listeners = {}

  // States
  var OFF = 0
  var WAITING = 1
  var ESTABLISHED = 2
  var state = OFF

  // Options:
  options = options || {}

  // Auto connect:
  if (options.auto === false) {
    options.auto = false
  } else {
    options.auto = true
  }
  options.timeout = typeof (options.timeout) === 'undefined' ? 3000 : options.timeout

  // Event emitter
  client.emit = client.trigger = function (type, data) {
    listeners[type] = listeners[type] || []
    listeners[type].forEach(function (listener) {
      listener.call(null, data)
    })
  }

  client.on = function (type, listener) {
    listeners[type] = listeners[type] || []
    listeners[type].push(listener)
  }

  client.off = client.removeListener = function (type, listener) {
    if (!listeners[type]) return
    listeners[type] = listeners[type].filter(function (_listener) {
      return listener !== _listener
    })
  }

  client.socket = null

  client.close = function () {
    client.socket.close()
  }

  client.connect = function (callback) {
    if (state !== OFF) {
      return
    }
    state = WAITING

    callback = callback || function () {}
    var loc = document.location
    var remote = (loc.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + loc.host + '/'

    try {
      client.socket = new window.WebSocket(remote, protocol)
    } catch(e) {
      return
    }

    if (options.timeout) {
      setTimeout(function () {
        if (state === WAITING) {
          try {
            client.close()
            client.emit('timeout')
          } catch(e) {}
        }
      }, options.timeout)
    }

    client.socket.onmessage = function (event) {
      var message = JSON.parse(event.data)
      client.trigger('message', message)
    }
    client.socket.onerror = function (error) {
      client.trigger('error', error)
      client.close()
    }
    client.socket.onopen = function (event) {
      state = ESTABLISHED
      client.trigger('open', event)
      callback()
    }
    client.socket.onclose = function (event) {
      client.trigger('close', event)
      state = OFF
      client.socket = null
    }
  }

  if (options.auto) client.connect()

  return client

}
