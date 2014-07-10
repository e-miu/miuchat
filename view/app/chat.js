define([
	"dojo/string",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/on",
	"dojo/keys",
	"dijit/registry",
	"dojox/html/entities",
	"dojo/text!/view/app/part/chatMessage.html",
	"dojo/text!/view/app/part/chatMessage2.html"
], function(string, domConstruct, domStyle, on, keys, registry, entities, chatMessage, chatMessage2) {
	return function(connection) {
		var _conn = connection,
			_socket = _conn.socket,
			_cpChatMessage = registry.byId("cpChatMessage"),
			_tbxChatInput = registry.byId("tbxChatInput"),
			_btnChatSubmit = registry.byId("btnChatSubmit"),
			_chat;

		/*
		 * イベント受信
		 */
		_socket.on('receive chat', function(data) {	// 発言の通知
			var _new = domConstruct.place(
				domConstruct.toDom(string.substitute(chatMessage, { user:data.name, msg:data.msg })),
				_cpChatMessage.domNode,
				'first'
			);
			if (data.id === _conn.userinfo.id) {
				domStyle.set(_new, 'color', '#3333cc');	// 自分の発言に色付け
			}
		});
		_socket.on('user join', function (data) {	// ユーザーのログイン通知
			var _msg = data.name + " さんが入室しました。",
				_new;
			_new = domConstruct.place(
				domConstruct.toDom(string.substitute(chatMessage2, { msg:_msg })),
				_cpChatMessage.domNode,
				'first'
			);
			domStyle.set(_new, 'color', '#cc3333');	// 色付け
		});

		/*
		 * ボタン、キーボード処理
		 */
		_chat = function() {
			var _msg = _tbxChatInput.get('value');
			if (_msg === '') {
				return;	// 入力無しなら何もしない
			}
			_conn.chat(entities.encode(_msg));
			_tbxChatInput.set('value', '');
		};
		_btnChatSubmit.on('click', _chat);
		on(_tbxChatInput.domNode, 'keydown', function(event) {	// enterでも発言
			switch (event.keyCode) {
				case keys.ENTER:
					_chat();
					break;
			}
		});
	};
});