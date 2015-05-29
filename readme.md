# lrio
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![travis][travis-image]][travis-url]
[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][downloads-url]

[travis-image]: https://img.shields.io/travis/nodys/lrio.svg?style=flat&branch=master
[travis-url]: https://travis-ci.org/nodys/lrio
[npm-image]: https://img.shields.io/npm/v/lrio.svg?style=flat
[npm-url]: https://npmjs.org/package/lrio
[downloads-image]: https://img.shields.io/npm/dm/lrio.svg?style=flat
[downloads-url]: https://npmjs.org/package/lrio

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


[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
