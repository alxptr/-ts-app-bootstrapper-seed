var jsonServer = require('json-server');
var server = jsonServer.create();
var router = jsonServer.router('server/router/data.json');
var express = require('express');

server.use([express.static('dist')]);

server.use(function (req, res, next) {
	 //res.sendStatus(401);
	next();
});

server.use('/api/1', router);

server.listen(3002, function () {
	console.log('|----------------------------------------------------------------------------------|');
	console.log('| A router server is listening on a 3002 port...                                   |');
	console.log('| An application is available on the link "http://localhost:3002/bc/#login=login1" |');
	console.log('|----------------------------------------------------------------------------------|');
	console.log();
});
