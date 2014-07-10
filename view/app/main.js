define([
	"dojo/parser",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dijit/registry",
	"dojo/text!/view/app/main.html"
],
function (parser, dom, domConstruct, domStyle, registry, main) {
	return function (connection) {
		var _conn = connection;

		// ログイン画面を削除して、メイン画面を表示する
		registry.byId("tcLogin").destroy();
		domConstruct.place(domConstruct.toDom(main), dojo.body());
		parser.parse();

		// 準備ができたら処理を実装
		require([ "dojo/ready" // domReady! じゃだめ。widgetの準備完了が保証されない。
		], function (ready) {
			ready(function () {
				/*
				 * ユーザーリスト部
				 */
				require([ "/view/app/userList.js" ], function (userList) {
					userList(_conn);
				});

				/*
				 * チャット部
				 */
				require([ "/view/app/chat.js" ], function (chat) {
					chat(_conn);
				});

				/*
				 * ゲーム部
				 */
				require([ "/view/app/game.js" ], function (game) {
					game(_conn);
				});
			});
		});
	};
});