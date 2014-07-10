define([
	"dojo/_base/declare",
	"/socket.io/socket.io.js"
], function(declare, io) {
    /* socket.ioの送信だけ集約する */
	return  declare("view.connection", null, {
		/*
		 * socket.ioのコネクション
		 */
		socket: null,

		/*
		 * anonymous識別用
		 */
		anonymous: '_anonymous',

		/*
		 * 自分情報
		 */
		userinfo: null,
//		{
//			name: '',
//			id: '',
//			score: {
//				win: 0,
//				lose: 0,
//				draw: 0
//			}
//		}

		/*
		 * constructor
		 * socket.ioのコネクションを張る
		 */
		constructor: function() {
			this.socket = io.connect();
		},

		/*
		 * login要求
		 */
		login: function(name, pass) {
			this.socket.json.emit('send login', { name: name, password: pass });
		},

		/*
		 * create login要求
		 */
		createLogin: function(name, pass) {
			this.socket.json.emit('send create login', { name: name, password: pass });
		},

		/*
		 * ユーザーリスト要求
		 */
		getUsers: function() {
		    this.socket.emit('get users');
		},

		/*
		 * チャット要求
		 */
		chat: function(msg) {
			this.socket.emit('chat', msg);
		},

		/*
		 * ゲーム状態取得要求
		 */
		getGameState: function() {
			this.socket.emit('get game state');
		},

		/*
		 * ゲーム参加要求
		 */
		joinGame: function() {
			this.socket.emit('join game');
		},

		/*
		 * パネル選択
		 */
		selectPanel: function(pos) {
			this.socket.emit('select panel', pos);
		}
	});
});