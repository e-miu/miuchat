define([
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/html",
	"dojo/string",
	"dijit/registry",
	"dojox/grid/DataGrid",
	"dojo/data/ItemFileWriteStore",
	"dojo/text!/view/app/part/userinfo.html",
	"dojo/text!/view/app/part/users.html"
], function (dom, domConstruct, on, html, string, registry, DataGrid, ItemFileWriteStore, userinfo, users) {
	return function (connection) {
		var _conn = connection,
			_socket = _conn.socket,
			_cpUserlist = registry.byId("cpUserlist"),
			_grid = null,
			ANONYMOUS = _conn.anonymous;

		/*
		 * グリッド構築 (グリッド使う意味ほとんどないけど、、練習がてら)
		 */
		_grid = new DataGrid({
			structure: [{
				field: "_item",
				name: "参加者一覧",
				width: "100%",
				styles: "border: none",
				formatter: function(item, rowIndex, cell) {
					var _store = cell.grid.store;
					return string.substitute(users, {
						name: _store.getValue(item, 'name'),
						win: _store.getValue(item, 'win'),
						lose: _store.getValue(item, 'lose'),
						draw: _store.getValue(item, 'draw')
					});
				}
			}],
			selectable: true,
			height: '100%',
			onStyleRow: function(row) {},
			canSort: false
		}, 'userList_grid');
		_grid.startup();

		/*
		 * イベント受信
		 */
		_socket.on('receive users', function (data) { // ユーザーリスト取得
			var _userlist = data;
			if (_conn.userinfo.id in _userlist) {
				delete _userlist[_conn.userinfo.id];
			}
			_grid.setStore((function() {
				var _storeData = {
					identifier: 'id',
					items: []
				};
				for (var _id in _userlist) {
					var _item = {
						id: _id,
						name: ANONYMOUS,
						win: '-',
						lose: '-',
						draw: '-'
					};
					if (_userlist[_id].name !== ANONYMOUS) {
						_item.name = _userlist[_id].name;
						_item.win = _userlist[_id].score.win;
						_item.lose = _userlist[_id].score.lose;
						_item.draw = _userlist[_id].score.draw;
					}
					_storeData.items.push(_item);
				}
				return new ItemFileWriteStore({data: _storeData});
			})());
		});
		_socket.on('user join', function (data) {	// ユーザーのログイン通知
			var _add = {
					name: ANONYMOUS,
					win: '-',
					lose: '-',
					draw: '-'
				};
			_grid.store.fetch({
				query: { id: data.id },
				onComplete: function(items, request) {
					if (! (items.length > 0)) {
						if (data.name !== ANONYMOUS) {
							_add.name = data.name;
							_add.win = data.score.win;
							_add.lose = data.score.lose;
							_add.draw = data.score.draw;
						}
						_add.id = data.id;
						_grid.store.newItem(_add);
					}
				},
			});
		});
		_socket.on('user logout', function (id) {	// ユーザーのログアウト通知
			_grid.store.fetch({
				query: { id: id },
				onItem: function(item, request) {
					_grid.store.deleteItem(item);
				}
			});
		});
		_socket.on('update score', function(data) { // ユーザーのスコア更新通知
			if (data.id === _conn.userinfo.id) {
				if (_conn.userinfo.name === ANONYMOUS) {
					return;
				}
				// 自分の成績更新
				if (data.score > 0) {
					// 勝ちカウントアップ
					html.set(dom.byId('userInfo_win'), ++_conn.userinfo.score.win + "");
				} else if (data.score < 0) {
					// 負けカウントアップ
					html.set(dom.byId('userInfo_lose'), ++_conn.userinfo.score.lose + "");
				} else {
					// 引き分けカウントアップ
					html.set(dom.byId('userInfo_draw'), ++_conn.userinfo.score.draw + "");
				}
				return;
			}
			_grid.store.fetch({
				query: { id: data.id },
				onItem: function(item, request) {
					if (_grid.store.getValue(item, 'name') === ANONYMOUS) {
						return;
					}
					// 他の人の成績更新
					if (data.score > 0) {
						// 勝ちカウントアップ
						var win = _grid.store.getValue(item, 'win');
						_grid.store.setValue(item, 'win', ++win);
					} else if (data.score < 0) {
						// 負けカウントアップ
						var lose = _grid.store.getValue(item, 'lose');
						_grid.store.setValue(item, 'lose', ++lose);
					} else {
						// 引き分けカウントアップ
						var draw = _grid.store.getValue(item, 'draw');
						_grid.store.setValue(item, 'draw', ++draw);
					}
				}
			});
		});

		/*
		 * 初期処理
		 */
		_conn.getUsers();	// ユーザーリスト取得要求
		domConstruct.place(	// 自分情報表示
			domConstruct.toDom(
				string.substitute(userinfo, {
					name : _conn.userinfo.name,
					win : _conn.userinfo.score.win,
					lose : _conn.userinfo.score.lose,
					draw : _conn.userinfo.score.draw
				})
			),
			dom.byId('userInfo')
		);
	};
});