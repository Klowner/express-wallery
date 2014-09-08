var
	fs = require('fs-then'),
	path = require('path'),
	when = require('when'),
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

	getThumbnail: function (slug, size, format) {
		var wallery = this,
			sizeDef = wallery.options.thumbnailSizes[size],
			filename = utils.getThumbnailFilename(
				wallery.options.thumbnailDirectory,
				slug,
				size,
				format
			);

		if (!sizeDef) {
			throw new Error("thumbnail definition for " + size + " is undefined");
		}

		return when.promise(function (resolve, reject, notify) {
			fs.stat(filename).then(function (stats) {
				// thumbnail file exists, return path to it
				resolve(filename);
			}, function (error) {
				// thumbnail does not yet exist.
				// find the thumbnail source.
				utils.getThumbnailSource(
					path.join(wallery.options.items, slug),
					wallery.options.thumbnailSourceFormats
				).then(function (srcPath) {
					// create thumbnail from srcPath
					utils.makeThumbnail(
						srcPath,
						filename,
						sizeDef
					).then(function (dstFile) {
						resolve(dstFile);
					});
				});
			});
		});
	}
};

module.exports = function (app, options) {
	return new Wallery(app, options);
};

