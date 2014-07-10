var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// ユーザー情報スキーマ定義
var UserSchema = new Schema({
	name: { type: String, required: true },
	password: { type: String, required: true },
	score: {
		win: { type: Number, min: 0, default: 0 },
		lose: { type: Number, min: 0, default: 0 },
		draw: { type: Number, min: 0, default: 0 }
	}
});
mongoose.model('User', UserSchema);
mongoose.connect('mongodb://localhost/miuchat');

exports.User = mongoose.model('User');
