var
	fs = require('fs'),
	_ = require('lodash'),
	utils = require('./wallery/utils'),
	routes = require('./wallery/routes');

function Wallery (app, options) {
	this.app = app;

	this.wallpapers = {};
	this.cache = {};

	this.watchers = [];

	this.options = utils.processOptions(options);

	routes.bindRoutes(this);
}


Wallery.prototype = {
	clearCache: function () {
		this.cache = {};
		return this;
	},

	init: function (callback) {
		var options = this.options;

		var promise = utils.getItemPaths(options.items).then(function (items) {
			console.log('found', items);
		}).then(function () {
			this.clearCache(wallery);
			return wallery;
		});

		return promise;
	},

	watch: function (callback) {
		var wallery = this,
			watcher = fs.watch(this.options.items, function (event, filename) {
				// ignore dotfiles
				if (filename.substr(0, 1) !== '.') {

					// manipulating files can cause a pile of reloads,
					// this will at debounce changes for a second.
					if (!this.debounce_init) {
						this.debounce_init = _.debounce(function () {
							return wallery.init().then(callback);
						}, 1000);
					}

					return this.debounce_init();
				}
			});

		this.watchers.push(watcher);
		return this;
	},

	getThumbnail: function (req, res, next) {
		console.log('getThumbnail()');
		next();
	}
};

module.exports = function (app, options) {
	return new Wallery(app, options);
};

