define([
	"dojo/_base/declare",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/on"
], function(declare, dom, domConstruct, domAttr, domStyle, on) {
	return  declare("view.board", null, {
		_conn: null,
		_type: [ '', '_maru', '_batu' ],
		_state: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		_isMove: false,

		constructor: function(connection, domBoard) {
			this._conn = connection;
			domConstruct.place(domConstruct.toDom(this.getBoard()), domBoard, 'only');
		},

		init: function() {
			for (var i = 1; i <= 9; ++i) {
				domStyle.set(dom.byId('group' + i + '_maru'), 'display', 'none');
				domStyle.set(dom.byId('group' + i + '_batu'), 'display', 'none');
				this._state[i] = 0;
				domAttr.set(dom.byId('group' + i + '_click'), 'fill', 'none');
			}
		},

		mark: function(pos, type) {
			if (1 <= type && type <= 2 && 1 <= pos && pos <= 9) {
				domStyle.set(dom.byId('group' + pos + this._type[type]), 'display', '');
				this._state[pos] = type;
			}
		},

		winmark: function(panel) {
			for (var key in panel) {
				domAttr.set(dom.byId('group' + panel[key] + '_click'), 'fill', '#ffcccc');
			}
		},

		getBoard: function() {
			return "" +
				"<svg xmlns='http://www.w3.org/2000/svg' width='170px' height='170px' viewBox='0 0 69 69'>" +
					"<style>" +
						".fill_rect:hover {" +
							"fill: #cccccc;" +
							"cursor: pointer;" +
						"}" +
					"</style>" +
					"<g id='group1'>" +
						"<rect x='0' y='0' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='11' cy='11' r='8' fill='none' stroke='black' stroke-width='1' id='group1_maru' style='display:none;' />" +
						"<path d='M3 3 L19 19 M3 19 L19 3' stroke='black' stroke-width='1' id='group1_batu' style='display:none;' />" +
						"<rect x='1' y='1' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group1_click' />" +
					"</g>" +
					"<g id='group2'>" +
						"<rect x='23' y='0' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='34' cy='11' r='8' fill='none' stroke='black' stroke-width='1' id='group2_maru' style='display:none;' />" +
						"<path d='M26 3 L42 19 M26 19 L42 3' stroke='black' stroke-width='1' id='group2_batu' style='display:none;' />" +
						"<rect x='24' y='1' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group2_click' />" +
					"</g>" +
					"<g id='group3'>" +
						"<rect x='46' y='0' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='57' cy='11' r='8' fill='none' stroke='black' stroke-width='1' id='group3_maru' style='display:none;' />" +
						"<path d='M49 3 L65 19 M49 19 L65 3' stroke='black' stroke-width='1' id='group3_batu' style='display:none;' />" +
						"<rect x='47' y='1' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group3_click' />" +
					"</g>" +
					"<g id='group4'>" +
						"<rect x='0' y='23' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='11' cy='34' r='8' fill='none' stroke='black' stroke-width='1' id='group4_maru' style='display:none;' />" +
						"<path d='M3 26 L19 42 M3 42 L19 26' stroke='black' stroke-width='1' id='group4_batu' style='display:none;' />" +
						"<rect x='1' y='24' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group4_click' />" +
					"</g>" +
					"<g id='group5'>" +
						"<rect x='23' y='23' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='34' cy='34' r='8' fill='none' stroke='black' stroke-width='1' id='group5_maru' style='display:none;' />" +
						"<path d='M26 26 L42 42 M26 42 L42 26' stroke='black' stroke-width='1' id='group5_batu' style='display:none;' />" +
						"<rect x='24' y='24' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group5_click' />" +
					"</g>" +
					"<g id='group6'>" +
						"<rect x='46' y='23' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='57' cy='34' r='8' fill='none' stroke='black' stroke-width='1' id='group6_maru' style='display:none;' />" +
						"<path d='M49 26 L65 42 M49 42 L65 26' stroke='black' stroke-width='1' id='group6_batu' style='display:none;' />" +
						"<rect x='47' y='24' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group6_click' />" +
					"</g>" +
					"<g id='group7'>" +
						"<rect x='0' y='46' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='11' cy='57' r='8' fill='none' stroke='black' stroke-width='1' id='group7_maru' style='display:none;' />" +
						"<path d='M3 49 L19 65 M3 65 L19 49' stroke='black' stroke-width='1' id='group7_batu' style='display:none;' />" +
						"<rect x='1' y='47' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group7_click' />" +
					"</g>" +
					"<g id='group8'>" +
						"<rect x='23' y='46' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='34' cy='57' r='8' fill='none' stroke='black' stroke-width='1' id='group8_maru' style='display:none;' />" +
						"<path d='M26 49 L42 65 M26 65 L42 49' stroke='black' stroke-width='1' id='group8_batu' style='display:none;' />" +
						"<rect x='24' y='47' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group8_click' />" +
					"</g>" +
					"<g id='group9'>" +
						"<rect x='46' y='46' width='23' height='23' fill='none' stroke='#b5bcc7' stroke-width='1' />" +
						"<circle cx='57' cy='57' r='8' fill='none' stroke='black' stroke-width='1' id='group9_maru' style='display:none;' />" +
						"<path d='M49 49 L65 65 M49 65 L65 49' stroke='black' stroke-width='1' id='group9_batu' style='display:none;' />" +
						"<rect x='47' y='47' width='21' height='21' fill='none' fill-opacity='0.3' pointer-events='all' class='fill_rect' id='group9_click' />" +
					"</g>" +
				"</svg>";
		}
	});
});