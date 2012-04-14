var sock = new SockJS('/socks');
sock.onopen = function() {
	console.log('open');
};
sock.onmessage = function(e) {
	console.log('message', e.data);
	log("Sending username...");
};

sock.onclose = function() {
	console.log('close');
};

$('#signin-button').click( function() {
	$('#signin').submit();
});

$('#signin').submit( function() {
	var username = $("input#username").val();
	if (username == null || username == '') {
		$("input#username").
		return false;
	}

	$('#login-window').hide();
	$('#log-window').show();

	log("Sending username...");
	sock.send(username);
	return false;
});

function log(msg) {
	$('#log-window').append('<p>' + msg '</p>');
}