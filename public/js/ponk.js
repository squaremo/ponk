// shim layer with setTimeout fallback
requestAnimFrame = 
  window.requestAnimationFrame       || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame    || 
  window.oRequestAnimationFrame      || 
  window.msRequestAnimationFrame     || 
  function( callback ){
    window.setTimeout(callback, 1000 / 60);
  };

var world = {
  player: {x: 0, y: 0, score: 0},
  opponent: {x: 0, y: 0, score: 0},
  ballpuck: {x: 100, y: 100, vx: 0, vy: 0}
}

var canvas, last, width, height, playergoalx, opponentgoalx;

var radius = 10, batpaddlewidth = 12, batpaddleheight = 80,
batpaddletravel = 15;

function init() {
  $('#game-window').show();
  last = +new Date();
  canvas = document.getElementById('game-field');
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  playergoalx = 0 + batpaddlewidth;
  opponentgoalx = width - batpaddlewidth;
  world.opponent.x = opponentgoalx;
  requestAnimFrame(frame);
  context = canvas.getContext('2d');
}

function stuckBallpuck() {
  var ballpuck = world.ballpuck,
  someone = ballpuck.stuck;
  ballpuck.vx = 0;
  ballpuck.vy = 0;
  ballpuck.x = someone.x;
  ballpuck.y = someone.y + batpaddleheight / 2;
}

function launch() {
  world.ballpuck.vx = 0.2;
  world.ballpuck.vy = 0.2;
  world.ballpuck.stuck = false;
}

function restart(someone) {
  world.ballpuck.stuck = someone;  
  setScores();
}

function setScores() {
  $('#playerscore').text(world.player.score);
  $('#opponentscore').text(world.opponent.score);
}

function frame(tick) {
  requestAnimFrame(frame);
  var since = tick - last;
  if (since < 20) {
//    return;
  }
  advanceWorld(since);
  render(since);
  last = tick;
}

function advanceWorld(dt) {
  var ballpuck = world.ballpuck;
  var player = world.player;
  var opponent = world.opponent;
  if (ballpuck.stuck) {
    stuckBallpuck();
  }
  else {
    ballpuck.x += (ballpuck.vx * dt);
    ballpuck.y += (ballpuck.vy * dt);
    if (ballpuck.x - radius < playergoalx) {
      if (ballpuck.y > player.y &&
          ballpuck.y < player.y + batpaddleheight) { 
        ballpuck.x = playergoalx + radius; ballpuck.vx *= -1;
      }
      else if (ballpuck.x < 0) {
        opponent.score ++;
        restart(player);
      }
    }
    if (ballpuck.x + radius > opponentgoalx) {
      if (ballpuck.y > opponent.y &&
          ballpuck.y < opponent.y + batpaddleheight) { 
        ballpuck.x = opponentgoalx - radius; ballpuck.vx *= -1;
      }
      else if (ballpuck.x > width) {
        player.score ++;
        restart(opponent);
      }
    }
    if (ballpuck.y - radius < 0) {
      ballpuck.y = radius; ballpuck.vy *= -1;
    }
    if (ballpuck.y + radius > height) {
      ballpuck.y = height - radius; ballpuck.vy *= -1;
    }
  }
}

function render(since) {
  context.clearRect(0, 0, width, height);
  var ballpuck = world.ballpuck;
  //console.log(ballpuck);
  context.fillStyle = '#333333';
  context.beginPath();
  context.arc(ballpuck.x, ballpuck.y, radius, 0, (Math.PI * 2), true);
  context.closePath();
  context.fill();
  renderBatpaddle(world.player, '#3366ff');
  renderBatpaddle(world.opponent, '#ff6633');
}

function renderBatpaddle(pos, col) {
  context.fillStyle = col;
  context.fillRect(pos.x, pos.y,
                   batpaddlewidth,
                   batpaddleheight);
}

function startGame() {
  world.ballpuck.stuck = world.player;
  init();
}

$(document).bind('keypress', function(event) {
  var key = String.fromCharCode(event.which);
  switch (key) {
  case ' ':
    if (world.ballpuck.stuck) {
      launch();
    }
    return false;
  case 'q':
    world.player.y -= batpaddletravel;
    return false;
  case 'a':
    world.player.y += batpaddletravel;
    return false;
  case 'p':
    world.opponent.y -= batpaddletravel;
    return false;
  case 'l':
    world.opponent.y += batpaddletravel;
    return false;
  }
});

// for now
startGame();
