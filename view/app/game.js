define([
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/on",
	"dojo/html",
	"dojo/_base/array",
	"dijit/registry",
	"/view/app/part/board.js"
], function(dom, domConstruct, domStyle, on, html, array, registry, board) {
	return function(connection) {
		var _conn = connection,
			_socket = _conn.socket,
			_cpGameBoard = registry.byId('cpGameBoard'),
			_cpGameInfo = registry.byId('cpGameInfo'),
			_btnStartGame = registry.byId('btnStartGame'),
			_spGameMessage = dom.byId('spGameMessage'),
			_tblGameMember = dom.byId('tblGameMember'),
			_gameWho1 = dom.byId('gameWho1'),
			_gameResult1 = dom.byId('gameResult1'),
			_gameWho2 = dom.byId('gameWho2'),
			_gameResult2 = dom.byId('gameResult2'),
			_spTurnMessage = dom.byId('spTurnMessage'),
			_board;

		/*
		 * ボード作成＆パネルクリックイベント設定
		 */
		_board = new board(_conn, _cpGameBoard.domNode);
		for (var i = 1; i <= 9; ++i) {
			on(dom.byId('group' + i + '_click'), 'click', (function() {
				var _pos = i;
				return function() {
					if (_board._isMove && _board._state[_pos] == 0) {	// 自分の手番 && クリックしたパネルがまだ書かれていない
						_board._isMove = false;
						_board._conn.selectPanel(_pos);
					}
				};
			})());
		}

		/*
		 * イベント受信
		 */
		_socket.on('game state', function(info) {	// ゲーム状態取得(battle: true/false, user1 { id:id, name:name }, user2 ..., { posN:type1/2, ... })
			if (info.battle) {	// バトル中
				_btnStartGame.set('disabled', true);	// ボタンは無効化
				for (var i = 1; i <= 9; ++i) {	// ボードの状態
					_board.mark(i, info.board[i]);
				}
				html.set(_spGameMessage, '対戦中!!');
				html.set(_gameWho1, info.user1.name);
				html.set(_gameWho2, info.user2.name);
			}
		});
		_socket.on('set panel', function(data) {	// パネル書き込み依頼
			_board.mark(data.pos, data.type);
		});
		_socket.on('your turn', function() {	// 手番通知
			_board._isMove = true;
			html.set(_spTurnMessage, 'あなたの番です');
		});
		_socket.on('opponent turn', function() {	// 手番通知
			_board._isMove = false;
			html.set(_spTurnMessage, '相手の番です');
		});
		_socket.on('finish game', function(result) {	// ゲームの決着通知(type: 1/2/3, panel: { 1:n1, 2:n2, 3:n3 })
			_board._isMove = false;
			var _msg = '対戦終了!!'
			if (result.type === 3) {	// 引き分け
				html.set(_gameResult1, '引き分け');
				html.set(_gameResult2, '引き分け');
			} else {
				if (result.panel) {
					_board.winmark(result.panel);	// 勝ちパネルをマーク
				} else {
					_msg += ' (対戦者が退出しました)';
				}
				if (result.type === 1) {
					html.set(_gameResult1, '勝ち');
					html.set(_gameResult2, '負け');
				} else {
					html.set(_gameResult1, '負け');
					html.set(_gameResult2, '勝ち');
				}
			}
			html.set(_spGameMessage, _msg);
			html.set(_spTurnMessage, '');	// ターン通知は消す
			_btnStartGame.set('disabled', false);	// ボタンを有効化
		});
		_socket.on('start game', function(info) {	// ゲーム開始通知
			_btnStartGame.set('disabled', true);	// ボタンは無効化
			_board.init();	// ボード初期化
			html.set(_gameResult1, '');
			html.set(_gameResult2, '');
			html.set(_spGameMessage, '対戦中!!');
			html.set(_gameWho1, (info.user1.id === _conn.userinfo.id ? 'あなた' : info.user1.name));
			html.set(_gameWho2, (info.user2.id === _conn.userinfo.id ? 'あなた' : info.user2.name));
		});
		_socket.on('fail join', function() {
			return;	// 何もしないでおく
		});
		_socket.on('fail select', function() {
			return;
		});

		/*
		 * ボタン処理
		 */
		_btnStartGame.on('click', function() {
			html.set(_spGameMessage, '参加者を待っています...');
			_board.init();
			html.set(_gameWho1, '');
			html.set(_gameWho2, '');
			html.set(_gameResult1, '');
			html.set(_gameResult2, '');
			_btnStartGame.set('disabled', true);	// ボタンは無効化
			_conn.joinGame();
		});

		/*
		 * 初期化
		 */
		_conn.getGameState();	// ゲーム状態取得要求
	};
});