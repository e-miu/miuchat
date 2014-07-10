/*
 * モジュール読み込み
 */
var http = require('http'),
	express = require('express'),
	settings = require('./settings.js'),
	fs = require('fs'),
	url = require('url');

/*
 * express、サーバー、socket.ioオブジェクト
 */
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

/*
 * expressの設定
 */
app.set('PORT', settings.PORT);
app.set('startServer', settings.startServer);

/*
 * サーバーへのアクセス受け付け
 */
app.get('/', function(req, res) {	// サーバールートへのアクセス
	res.send("miu web server works!");
});
app.get('/miuchat', function(req, res) {	// チャット機能へのアクセス
	fs.readFile("./view/index.html", 'utf8', function(err, data) {	// res.sendfileで良いけど、file stream使ってみる
		if (err) {
			res.send(500, "Failed to launch chatroom.");
			return;
		}
		res.send(200, data);
	});
});
app.get('/view/*', function(req, res) {	// クライアント用ファイル群を返す
	res.sendfile("./view/" + req.params[0]);
});

/*
 * socket.ioでのWebSocket通信処理振り分け
 */
require('./socketRouter').start(io);

/*
 * サーバー起動
 */
server.listen(process.env.PORT || app.get('PORT'), process.env.IP || "0.0.0.0", app.get('startServer'));
