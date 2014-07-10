var User = require('./dbschema.js').User;

exports.start = function(io) {
	var _loginUsers = {},   // ログイン中のユーザーリスト( { <socket.id>: { name: <user name>, socket: <socket>, score: { win: x, lose: y, draw: z }, ... } )
		_login,
		_authUser,
		_addUser,
		_logout,
		_updateUsersScore,
		_updateScore,
		_getUsers,
		_game = {
			member: [ '', '', '' ],
			board: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
			turn: 0,
			getType: function(id) {
				if (this.member[1] === id) {
					return 1;
				} else if (this.member[2] === id) {
					return 2;
				}
				return 0;
			},
			init: function() {
				for (var i = 1; i <= 9; ++i) {
					this.board[i] = 0;
				}
				this.member[1] = '';
				this.member[2] = '';
				this.turn = 0;
			},
			getState: function() {
				var _ret = 3;	// 0:誰もいない、1:1が空いてる、2:2が空いてる、3:ゲーム中
				if (this.member[1] === '' && this.member[2] === '') {
					_ret = 0;
				} else if (this.member[1] === '') {
					_ret = 1;
				} else if (this.member[2] === '') {
					_ret = 2;
				}
				return _ret;
			},
			join: function(id) {
				var _state = this.getState(),
					_ret = true;
				if (_state === 0) {
					this.member[Math.floor(Math.random() * 2) + 1] = id;	// 先攻（○）後攻（×）はランダムに設定
				} else if (_state === 1) {
					this.member[1] = id;
				} else if (_state === 2) {
					this.member[2] = id;
				} else {
					_ret = false;
				}
				return _ret;
			},
			set: function(id, pos) {	// ○×を書き込む
				if (! (this.member[1] === id || this.member[2] === id)) {
					console.log("_game.set error: not member");
					return -1;	// ゲーム中のメンバーじゃない
				}
				if (this.member[this.turn] !== id) {
					console.log("_game.set error: not your turn");
					return -2;	// idの手番じゃない
				}
				if (this.board[pos] !== 0) {
					console.log("_game.set error: already checked");
					return -3;	// すでに書き込まれたマス
				}
				this.board[pos] = this.turn;
				return 0;
			},
			changeTurn: function() {
				this.turn = this.turn === 1 ? 2 : 1;
			},
			checkWinner: function() {
				var _ret = {
						type: 3,	// 引き分け
						panel: {}
					},
					_this = this,
					_checker = function(n1, n2, n3, type, ret) {
						if (_this.board[n1] === type &&
							_this.board[n2] === type &&
							_this.board[n3] === type) {
							ret.panel['1'] = n1;
							ret.panel['2'] = n2;
							ret.panel['3'] = n3;
							return true;
						}
						return false;
					};
				for (var i = 1; i <= 2; ++i) {
					if (_checker(1, 2, 3, i, _ret) ||
						_checker(4, 5, 6, i, _ret) ||
						_checker(7, 8, 9, i, _ret) ||
						_checker(1, 4, 7, i, _ret) ||
						_checker(2, 5, 8, i, _ret) ||
						_checker(3, 6, 9, i, _ret) ||
						_checker(1, 5, 9, i, _ret) ||
						_checker(3, 5, 7, i, _ret)) {
							_ret.type = i;	// 1/2の勝ち
							break;
					}
				}
				if (_ret.type === 3) {
					for (var i = 1; i <= 9; ++i) {
						if (this.board[i] === 0) {
							_ret.type = 0;	// ゲーム中
							break;;
						}
					}
				}
				return _ret;
			},
			getUpdateInfo: function(win) {
				var _ret = {};
				if (this.getState() === 3) {
					_ret[this.member[1]] = { name: _loginUsers[this.member[1]].name, type: 0 };
					_ret[this.member[2]] = { name: _loginUsers[this.member[2]].name, type: 0 };
					if (win === 1) {
						_ret[this.member[1]].type = 1;
						_ret[this.member[2]].type = -1;
					} else if (win === 2) {
						_ret[this.member[1]].type = -1;
						_ret[this.member[2]].type = 1;
					}
				}
				return _ret;
			}
		},
	    ANONYMOUS = '_anonymous'; // 名無しの場合の内部ユーザー名（クライアントと定義を合わせる）

	/*
	 * _loginUsers = {
	 * 		<socket.id>: {
	 * 			name: <username>,
	 * 			socket: <socket>,
	 * 			score: {
	 * 				win: xxx,
	 * 				lose: yyy,
	 * 				draw: zzz
	 * 			}
	 * 		}
	 * 	}
	 */

	/*
	 * パスワード認証
	 */
	_authUser = function(user, socket, ret, callback) {
		if (user.name === '') {	// 名無しはチェック不要
			_loginUsers[socket.id] = {	// リストに追加
				name: ret.name,
				socket: socket
			};
			callback(ret);
			return;
		} else {
			for ( var _id in _loginUsers) {	// すでにログインしているユーザーかチェック
				if (_loginUsers[_id].name === user.name) {
					ret.status = -1;
					ret.msg = "すでにログインしています";
					callback(ret);
					return;
				}
			}
		}
		User.findOne({name:user.name}, function(err, doc) {
			if (err) {	// 異常
				console.log("-103: " + err);
				ret.status = -103;
				ret.msg = '(db)ユーザー取得異常: ' + err;
				callback(ret);
				return;
			}
			if (! doc) {	// nullならいない
				console.log("ユーザーが存在しない");
				ret.status = -1;
				ret.msg = 'ユーザー名またはパスワードに誤りがあります';
				callback(ret);
				return;
			}
			if (doc.password !== user.password) {	// パスワード不一致
				console.log("パスワード不一致");
				ret.status = -1;
				ret.msg = 'ユーザー名またはパスワードに誤りがあります';
				callback(ret);
				return;
			}
			ret.name = doc.name;
			ret.score = doc.score;
			_loginUsers[socket.id] = {	// リストに追加
				name: doc.name,
				socket: socket,
				score: doc.score
			};
			console.log("login user: [" + user.name + "]");
			callback(ret);
			return;
		});
	};

	/*
	 * ユーザー登録
	 */
	_addUser = function(user, socket, ret, callback) {
		User.count({name: user.name}, function(err, count) {
			if (err) {
				console.log("-101: " + err);
				ret.status = -101;
				ret.msg = '(db)存在チェック異常: ' + err;
				callback(ret);
				return;
			}
			if (count > 0) {
				console.log("-1");
				ret.status = -1;
				ret.msg = 'すでに同名のユーザーがいます';
				callback(ret);
				return;
			}
			var _user = new User();
			_user.name = user.name;
			_user.password = user.password;
			_user.save(function(err) {
				if (err) {
					console.log("-102: " + err);
					ret.status = -102;
					ret.msg = '(db)保存異常: ' + err;
					callback(ret);
					return;
				}
				ret.name = _user.name;
				ret.score = {
					win: 0,
					lose: 0,
					draw: 0
				};
				_loginUsers[socket.id] = {	// リストに追加
					name : ret.name,
					socket : socket,
					score: ret.score
				};
				console.log("create user: [" + user.name + "]");
				callback(ret);
				return;
			});
		});
	};

	/*
	 * ユーザー登録、認証、ログイン処理
	 */
	_login = function (user, socket, type, callback) {
		/*
		 * user = { name: name, password: password }
		 */
		var _ret = {
			status : 0,
			msg : "",
			name : ANONYMOUS,
			id : socket.id
		};

		// すでにログインしているユーザー?? id重複
		if (socket.id in _loginUsers) {
			_ret.status = -1;
			_ret.msg = "奇妙なことに、あなたはすでにログインしています ???";
			callback(_ret);
			return;
		}

		switch (type) {
			case 1:
				_authUser(user, socket, _ret, callback);
				return;
			case 2:
				if (user.name === '' || user.password === '') {	// 念のため空チェック
					_ret.status = -1;
					_ret.msg = 'ユーザー名またはパスワードに誤りがあります。';
					callback(_ret);
					return;
				}
				_addUser(user, socket, _ret, callback);
				return;
		}
		_ret.status = -1;
		_ret.msg = "typeの指定が異常です";
		callback(_ret);
		return;
	};

	/*
	 * 指定ユーザーの戦績を更新
	 */
	_updateScore = function(id, name, type) {
		var _typeName = "draw";
		if (type < 0) {
			_typeName = "lose";
		} else if (type > 0) {
			_typeName = "win";
		}
		var _change = {};
		_change["score." + _typeName] = 1;
		User.update(
			{ name: name },
			{ $inc: _change },	// インクリメントする
			{ multi: false },
			function(err, num) {
				if (err) {
					console.log("(db)スコア更新異常: " + err);
					return;
				}
				if (num !== 1) {
					console.log("スコア更新異常?: name = " + name);
					return;
				}
				console.log("スコア更新: " + name + "(" + _typeName + ")");
				if (id in _loginUsers) {	// ログアウトしている可能性あり
					_loginUsers[id].score[_typeName]++;
				}
				io.sockets.json.emit('update score', {
					id: id,
					score: type
				});
			}
		);
	};
	_updateUsersScore = function (update) {
		for (var _id in update) {
			if (update[_id].name === ANONYMOUS) {
				console.log("anonymousはスコア更新しない");
				continue;	// 七誌は不要
			}
			_updateScore(_id, update[_id].name, update[_id].type);	// 更新
		}
	};

	/*
	 * ログインユーザー一覧取得
	 */
	_getUsers = function () {
		var _ret = {};
		for ( var _id in _loginUsers) {
			// socketプロパティを除く
			_ret[_id] = {}; // まずはプロパティを作る
			_ret[_id].name = _loginUsers[_id].name;
			_ret[_id].score = _loginUsers[_id].score;
		}
		return _ret;
	};

	/*
	 * ログアウト処理
	 */
	_logout = function (socket) {
		if (socket.id in _loginUsers) {
			console.log("[" + _loginUsers[socket.id].name + "] logout.");
			delete _loginUsers[socket.id]; // ログイン一覧から削除
		}
	};

	/*
	 * 受信
	 */
	io.sockets.on('connection', function(socket) {
		console.log("connection established.");

		/*
		 * ログイン要求 / ユーザー登録要求
		 */
		socket.on('send login', function (user) {
			var _callback = function () {
				var _sock = socket;
				return function(ret) {
					_sock.json.emit('receive login', ret); // 結果を通知
					if (!(ret.status < 0)) {
						_sock.broadcast.emit('user join', { // ログインに成功した場合、他のユーザーに通知する
							id : socket.id,
							name : ret.name,
							score : ret.score
						});
					}
				};
			}();
			_login(user, socket, 1, _callback); // 認証、ログイン
		});
		socket.on('send create login', function(user) {
			var _callback = function() {
				var _sock = socket;
				return function(ret) {
					_sock.json.emit('receive create login', ret);	// 結果を通知
					if (!(ret.status < 0)) {
						_sock.broadcast.emit('user join', { // ログインに成功した場合、他のユーザーに通知する
							id : socket.id,
							name : ret.name,
							score : ret.score
						});
					}
				};
			}();
			console.log("send create login request.");
			_login(user, socket, 2, _callback); // 登録、ログイン
		});

		/*
		 * 発言
		 */
		socket.on('chat', function(msg) {
			console.log("chat request.");
			if (socket.id in _loginUsers) {
				io.sockets.json.emit('receive chat', {
					id: socket.id,
					name: _loginUsers[socket.id].name,
					msg: msg
				});
				return ;
			}
			console.log("chat from unknown user.");
		});

        /*
		 * ログインユーザー一覧取得
		 */
		socket.on('get users', function () {
			socket.json.emit('receive users', _getUsers());
		});

		/*
		 * ゲーム状態取得
		 */
		socket.on('get game state', function() {
			var _info = {};
			_info.battle = (_game.getState() == 3 ? true : false);
			if (_info.battle) {
				_info.user1 = {};
				_info.user1.id = _game.member[1];
				_info.user1.name = _loginUsers[_info.user1.id].name;
				_info.user2 = {};
				_info.user2.id = _game.member[2];
				_info.user2.name = _loginUsers[_info.user2.id].name;
				_info.board = {};
				for (var i = 1; i <= 9; ++i) {
					_info.board[i] = _game.board[i];
				}
			}
			socket.json.emit('game state', _info);
		});

		/*
		 * ゲーム参加通知
		 */
		socket.on('join game', function() {
			if (! _game.join(socket.id)) {
				console.log("fail join");
				socket.emit('fail join');
				return;
			}
			if (_game.getState() === 3) {	// ゲーム開始する
				var _info = {};
				_info.user1 = {};
				_info.user1.id = _game.member[1];
				_info.user1.name = _loginUsers[_info.user1.id].name;
				_info.user2 = {};
				_info.user2.id = _game.member[2];
				_info.user2.name = _loginUsers[_info.user2.id].name;
				_game.turn = 1;
				io.sockets.json.emit('start game', _info);
				_loginUsers[_game.member[2]].socket.emit('opponent turn');
				_loginUsers[_game.member[1]].socket.emit('your turn');
				return ;
			}
		});

		/*
		 * パネル選択
		 */
		socket.on('select panel', function(pos) {
			if (_game.set(socket.id, pos) < 0) {
				console.log("fail select");
				socket.emit('fail select');	// 失敗
				return;
			}
			io.sockets.json.emit('set panel', {	// 書き込み通知
				type: _game.turn,
				pos: pos
			});
			var _winInfo = _game.checkWinner();
			if (_winInfo.type > 0) {	// 勝負あり
				console.log("finish game.");
				_updateUsersScore(_game.getUpdateInfo(_winInfo.type));	// スコア更新
				_game.init();	// ゲーム状態初期化
				io.sockets.json.emit('finish game', _winInfo);	// 終了通知
				return;
			}
			console.log("next turn.");
			_loginUsers[_game.member[_game.turn]].socket.emit('opponent turn');	// == socket.emit(...)
			_game.changeTurn();	// ターンチェンジ
			_loginUsers[_game.member[_game.turn]].socket.emit('your turn');
		});

		/*
		 * 切断
		 */
		socket.on('disconnect', function () {
			console.log("disconnected.");
			if (_game.getType(socket.id) > 0) {
				if (_game.getState() === 3) {
					// ゲーム中なら終了させる
					var _win = _game.getType(socket.id) === 1 ? 2 : 1;
					io.sockets.json.emit('finish game', {
						type: _win
					});
					_updateUsersScore(_game.getUpdateInfo(_win));
				}
				_game.init();
			}
			socket.broadcast.emit('user logout', socket.id);	// みんなに通知
			_logout(socket);	// リストから削除
		});
	});
};