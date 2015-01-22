# lrio [![Build Status](https://secure.travis-ci.org/nodys/lrio.png?branch=master)](http://travis-ci.org/nodys/lrio) [![NPM version](https://badge-me.herokuapp.com/api/npm/lrio.png)](http://badges.enytc.com/for/npm/lrio)

> Minimalist websocket broadcast server and browser client

## Feature

- Broadcast messages using a dedicated channel
- Attach as many websocket server you want without collision
- Client for browserify
- Based on [WebSocket-Node](https://github.com/Worlize/WebSocket-Node)

## Usage

```bash
npm install --save lrio
```

### Server side

```javascript

var http   = require('http');
var lrio   = require('lrio');
var server = http.createServer();

var A = lrio(server, 'myChannelA');
var B = lrio(server, 'myChannelB');

server.listen(8080);

// Broadcast message on myChannelA
A.broadcast({my:42})

// Broadcast message on myChannelB
B.broadcast({foo:'bar'})

// Other events :
A.on('join',  function(client) {})
A.on('leave', function(client) {})

```
Notice that `client` are [WebSocketConnection](https://github.com/Worlize/WebSocket-Node/wiki/Documentation#websocketconnection) instances

### Client side (using browserify)

```javascript

var lrio   = require('lrio');

var A = lrio('myChannelA');
var B = lrio('myChannelB');

A.on('message', function(message) { console.log(message) })
B.on('message', function(message) { console.log(message) })

// Other events:
A.on('open', function() {})
A.on('close', function() {})
A.on('error', function() {})

A.close(); // Close websocket
A.connect(); // Re-connect  (only if closed)

```

## License
[The MIT license](./LICENSE) • Novadiscovery
