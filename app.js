
var express = require('express'),
sockjs = require('sockjs');

function debug(msg) {
  console.log(msg);
}

var server = express.createServer();

server.configure(
  function() {
    server.use(express.static(__dirname + '/public'))
  });

var socks = sockjs.createServer();
socks.installHandlers(server, {prefix:'/socks'});

socks.on('connection', function(conn) {
  initPlayer(conn);
});

function initPlayer(connection) {
  var player = new Player(connection);
  connection.on('data', function(msg) {
    var event = JSON.parse(msg);
    player.handler(event);
  });
  connection.on('end', function() {
    // Um.
  });
}

function Player(conn) {
  this.info = {wins: 0};
  this.connection = conn;
  this.handler = registering;
}

Player.prototype.breakHorribly = function(state, event) {
  debug({bork: {state: state, event: event}});
}

function registering(event) {
  switch (event.event) {
  case 'register':
    this.info.name = event.data;
    debug({welcome: this.info});
    this.match();
    break;
  default:
    this.breakHorribly('registering', event);
  }
}

Player.prototype.match = function() {
  this.handler = matching;
  makeMatches(this);
};

Player.prototype.play = function(opponent) {
  this.connection.write(JSON.stringify({event: 'start', data: opponent.info}));
  this.handler = playing;
}

function matching(event) {
  this.breakHorribly('matching', event);
}

function playing(event) {
  debug({player: this.info, event: event});
}

var queue = [];
function makeMatches(player) {
  queue.push(player);
  attemptMatches();
}

function attemptMatches() {
  if (queue.length > 1) {
    var player1 = queue.shift();
    var player2 = queue.shift();
    gameOn(player1, player2);
    attemptMatches();
  }
}

function gameOn(player1, player2) {
  debug("Matching " + player1.info.name + " with " + player2.info.name);
  player1.play(player2);
  player2.play(player1);
  playUntilFinish(player1, player2);
}

function playUntilFinish(player1, player2) {
  function hookup(player1, player2) {
    player1.connection.on('data', function(msg) {
      var event = JSON.parse(msg);
      switch (event.event) {
      case 'pos':
      case 'win':
      case 'move':
        player2.connection.write(msg);
      }
    });
  }
  hookup(player1, player2);
  hookup(player2, player1);
}

// Fight!
server.listen(process.env['VCAP_APP_PORT'] || 3000);
