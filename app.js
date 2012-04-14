var express = require('express'),
server = express.createServer();

server.configure(
  function() {
    server.use(express.static(__dirname + '/public'))
  });

// Fight!

server.listen(process.env['VCAP_APP_PORT'] || 3000);
