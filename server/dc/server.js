var jsonServer = require('json-server');
var server = jsonServer.create();
var router = jsonServer.router('server/dc/data.json');
var middlewares = jsonServer.defaults();
var express = require('express');

// change a static dir
middlewares.push(express.static('dist'));

server.use(middlewares);

server.use(function (req, res, next) {
	// res.sendStatus(401);
	next();
});

server.use('/api/1', router);

server.listen(3001, function () {
	console.log('|--------------------------------------------------------------------------------------|');
	console.log('| A data center is listening on a 3001 port...                                         |');
	console.log('| An application is available on the link "http://localhost:3001/bc/#login=login1"     |');
	console.log('|--------------------------------------------------------------------------------------|');
	console.log();
});
