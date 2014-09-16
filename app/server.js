var static = require('node-static');

var file = new static.Server('../app');

require('http').createServer(function (request, response) {
    file.serve(request, response);
}).listen(5000);