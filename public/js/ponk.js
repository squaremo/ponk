var sock = new SockJS('/socks');
sock.onopen = function() {
	console.log('open');
};
sock.onmessage = function(e) {
	console.log('message', e.data);
};
sock.onclose = function() {
	console.log('close');
};

$('#signin-button').click( function() {
	$('#signin').submit();
});

$('#signin').submit( function() {
	$('#login-window').hide();

	var username = $("input#username").val();
	sock.send(username);

	$('#log-window').show();

	return false;
});

