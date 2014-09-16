var ElasticClient = require('elasticsearchclient'),
   conf          = require('./config'),
   fbutil        = require('./lib/fbutil'),
   PathMonitor   = require('./lib/PathMonitor'),
   SearchQueue   = require('./lib/SearchQueue');

// connect to ElasticSearch
var esc = new ElasticClient({
   host: conf.ES_HOST,
   port: conf.ES_PORT,
//   pathPrefix: 'optional pathPrefix',
   secure: false,
   //Optional basic HTTP Auth
   auth: conf.ES_USER? {
      username: conf.ES_USER,
      password: conf.ES_PASS
   } : null
});
console.log('Connected to ElasticSearch host %s:%s'.grey, conf.ES_HOST, conf.ES_PORT);

fbutil.auth(conf.FB_URL, conf.FB_TOKEN).done(function() {
   PathMonitor.process(esc, conf.FB_URL, conf.paths, conf.FB_PATH);
   console.log(conf.FB_URL);
   console.log(conf.FB_REQ);
   console.log(conf.FB_RES);
   SearchQueue.init(esc, conf.FB_URL, conf.FB_REQ, conf.FB_RES, conf.CLEANUP_INTERVAL);
});

var static = require('node-static');

var file = new static.Server('./app');

require('http').createServer(function (request, response) {
    file.serve(request, response);
}).listen(process.env.PORT || 5000);

console.log("website started");

