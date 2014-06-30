var connect = require('connect');

connect.createServer(
	connect.static("../new_example")
).listen(5000);
