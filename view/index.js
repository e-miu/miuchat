require([
	"/view/app/connection.js",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/parser",
	"dojo/text!/view/app/login.html"
], function(connection, dom, domConstruct, domStyle, parser, login) {
	var _conn = null,
		_receiver = null,
		_divLoading = dom.byId("divLoading");	// ロード中div

	// サーバーと接続
	_conn = new connection();

	// ロード中画面を削除して、ログイン画面を表示
	(function() {
		domConstruct.destroy(_divLoading);
		domConstruct.place(domConstruct.toDom(login), dojo.body());
		parser.parse();
	})();

	// ログイン画面が表示されたら、ログイン画面関連処理を実装する
	require([
		"dijit/registry",
		"dijit/form/TextBox",
		"dijit/form/Button",
		"dojo/on",
		"dojo/aspect",
		"dojo/_base/array",
		"dojo/ready"
	], function(registry, TextBox, Button, on, aspect, array, ready) {
		ready(function() {
			var _socket = _conn.socket,
				_tcLogin = registry.byId("tcLogin"),
				_cpLogin = registry.byId("cpLogin"),
				_tbxLoginName = registry.byId("tbxLoginName"),
				_tbxLoginPassword = registry.byId("tbxLoginPassword"),
				_btnLoginSubmit = registry.byId("btnLoginSubmit"),
				_divLoginMessage = dom.byId("divLoginMessage"),
				_cpCreateUser = registry.byId("cpCreateUser"),
				_tbxCreateName = registry.byId("tbxCreateName"),
				_tbxCreatePassword = registry.byId("tbxCreatePassword"),
				_btnCreateSubmit = registry.byId("btnCreateSubmit"),
				_divCreateMessage = dom.byId("divCreateMessage"),
				_username = '',
				_adjustFormState;

			_adjustFormState = function (bDisable) { // フォーム状態のトグル
				_tbxLoginName.set("disabled", bDisable);
				_tbxLoginPassword.set("disabled", bDisable);
				_btnLoginSubmit.set("disabled", bDisable);
				_tbxCreateName.set("disabled", bDisable);
				_tbxCreatePassword.set("disabled", bDisable);
				_btnCreateSubmit.set("disabled", bDisable);
			};

			/*
			 * イベント受信
			 */
			array.forEach([ "receive login", "receive create login" ], function (entry, i) {
				var _divMessage = (entry === "receive login") ? _divLoginMessage : _divCreateMessage, // メッセージ表示領域
					_cpSelect = (entry === "receive login") ? _cpLogin : _cpCreateUser; // 選択するタブ
				_socket.on(entry, function (data) {
					_adjustFormState(false);
					if (_conn.userinfo) {
						return; // すでにログインしている
					}
					_tcLogin.selectChild(_cpSelect); // 対象タブを選択
					if (data.status < 0) {
						// ログイン失敗
						var msg = "failed" + (data.msg ? ": " + data.msg : ".");
						domConstruct.place(domConstruct.toDom("<span style='color: red;'>" + msg + "</span>"), _divMessage);
						domStyle.set(_divMessage, 'display', 'block');
						return;
					}
					// ログイン成功
					_conn.userinfo = {};
					_conn.userinfo.name = data.name;
					_conn.userinfo.id = data.id;
					if (data.name === _conn.anonymous) {
						_conn.userinfo.score = {
							win : '-',
							lose : '-',
							draw : '-'
						};
					} else {
						_conn.userinfo.score = data.score;
					}
					localStorage.setItem('username', _username); // 前回値として保存
					require([ "/view/app/main.js" ], function (main) {
						var _go = function () {
							main(_conn);
						};
						// メインページへGo!
						if (entry === "receive login" && _conn.userinfo.name === _conn.anonymous) {
							dlgAlert.set("content", "匿名ユーザーでログインします。<br>（成績は保存されません）");
							dlgAlert.show();
							aspect.after(dlgAlert, "hide", function () {
								dlgAlert.destroy();
								main(_conn);
							});
							return;
						}
						if (entry === "receive create login") {
							dlgAlert.set("content", "ユーザーを登録しました！<br>ログインします。");
							dlgAlert.show();
							aspect.after(dlgAlert, "hide", function () {
								dlgAlert.destroy();
								main(_conn);
							});
							return;
						}
						main(_conn);
					});
				});
			});

    		/*
			 * ボタン処理
			 */
    		_btnLoginSubmit.on('click', function() {	// login
    			var _password = '';
    			_username = '';

    		    // メッセージ部初期化
    		    domConstruct.empty(_divLoginMessage);
    		    domStyle.set(_divLoginMessage, 'display', 'none');

    		    // 禁則チェック
    			if (! _tbxLoginName.isValid()) {
    				_tbxLoginName.focus();
    				_tbxLoginName.domNode.select();
    				return;
    			}
    			if (! _tbxLoginPassword.isValid()) {
    				_tbxLoginPassword.focus();
    				_tbxLoginPassword.domNode.select();
    				return;
    			}

    			// ユーザー名ありなら、パスワード必須入力
    			_username = _tbxLoginName.get("value");
    			if (_username !== '') {
    				_password = _tbxLoginPassword.get("value");
    				if (_password === '') {
        				domConstruct.place(domConstruct.toDom("<span style='color: red;'>パスワードを入力してください</span>"), _divLoginMessage);
        				domStyle.set(_divLoginMessage, 'display', 'block');
    					return;
    				}
    			}

    			// ログイン
    			_conn.login(_username, _password);
    			_adjustFormState(true);
    		});
    		_btnCreateSubmit.on('click', function() {	// create & login
    			var _password = '';
    			_username = '';

    		    // メッセージ部初期化
    		    domConstruct.empty(_divCreateMessage);
    		    domStyle.set(_divCreateMessage, 'display', 'none');

    		    // 禁則チェック
    			if (! _tbxCreateName.isValid()) {
    				_tbxCreateName.focus();
    				_tbxCreateName.domNode.select();
    				return;
    			}
    			if (! _tbxCreatePassword.isValid()) {
    				_tbxCreatePassword.focus();
    				_tbxCreatePassword.domNode.select();
    				return;
    			}

				// 空文字チェック
				_username = _tbxCreateName.get("value");
				if (_username === '') {
					domConstruct.place(domConstruct.toDom("<span style='color: red;'>ユーザー名を入力してください</span>"), _divCreateMessage);
					domStyle.set(_divCreateMessage, 'display', 'block');
					return;
				}
				_password = _tbxCreatePassword.get("value");
				if (_password === '') {
					domConstruct.place(domConstruct.toDom("<span style='color: red;'>パスワードを入力してください</span>"), _divCreateMessage);
					domStyle.set(_divCreateMessage, 'display', 'block');
					return;
				}

				// ログイン
				_conn.createLogin(_username, _password);
				_adjustFormState(true);
			});

			/*
			 * 初期処理
			 */
			_tbxLoginName.set('value', localStorage.getItem('username'));	// 前回ログインユーザー名反映
		});
	});
});