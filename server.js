var connect = require('connect');

connect.createServer(
	connect.static("../bookreadings")
).listen(5000);
