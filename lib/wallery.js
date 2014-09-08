var
	fs = require('fs-then'),
	path = require('path'),
	when = require('when'),
	_ = require('lodash'),
	utils = require('./wallery/utils'),
	routes = require('./wallery/routes'),
	createHelpers = require('./wallery/helpers');

function Wallery (app, options) {
	this.app = app;

	this.items = {};
	this.cache = {};

	this.watchers = [];

	this.options = utils.processOptions(options);

	this.helpers = createHelpers(this);

	_.extend(app.locals, this.helpers);

	routes.bindRoutes(this);
}


Wallery.prototype = {
	clearCache: function () {
		this.cache = {};
		return this;
	},

	init: function (callback) {
		var wallery = this,
			options = this.options;

		var promise = utils.getItemPaths(options.items).then(function (items) {

			return when.all(items.map(function (file) {
				return utils.createItem(path.join(options.items, file), options).then(function (item) {
					wallery.items[item.slug] = item;
					return item;
				});
			}));
		}).then(function (items) {
			wallery.clearCache();
			return wallery;
		});

		if (callback)
			promise.then(callback.bind(null, null));

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
	},

	getItems: function () {

	}
};

module.exports = function (app, options) {
	return new Wallery(app, options);
};

