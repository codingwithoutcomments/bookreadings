var express = require('express');
var app = express();

app.use(express.static(__dirname + '/app'));
app.use(require('prerender-node').set('prerenderToken', 'bJ0gTGu5UrNSqqO6mkH8'));

app.listen(process.env.PORT || 5000);