require('when/monitor/console');
var
	fs = require('fs-then'),
	path = require('path'),
	when = require('when'),
	_ = require('lodash'),
	utils = require('./wallery/utils'),
	routes = require('./wallery/routes'),
	createHelpers = require('./wallery/helpers'),
	itemFactoryGenerator = require('./wallery/item').itemFactoryGenerator;

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

	ini2t: function (callback, err) {
		var wallery = this,
			options = this.options,
			itemFactory = itemFactoryGenerator(wallery);

		var promise = utils.getItemPaths(options.items).then(function (items) {
			console.log('found', items.length, 'items');
			return when.settle(items.map(function (file) {
				return utils.createItem(path.join(options.items, file), options, itemFactory)
					.then(function (item) {
						wallery.items[item.slug] = item;
						return item;
					});
			})).then(function (descriptors) {
				var errorItems = [];

				descriptors.forEach(function (d) {
					if (d.state == 'rejected') {
						errorItems.push(d.value);
					}
				});
			});
		}).then(function (items) {
			wallery.clearCache();
			return wallery;
		});

		if (callback)
			promise.then(callback.bind(null, null));

		return promise;
	},

	init: function (callback) {
		var wallery = this,
			options = this.options,
			itemFactory = itemFactoryGenerator(wallery);

		var promise = when.promise(function (resolve, reject, notify) {

			return utils.getItemPaths(options.items)
				.then(function (itempaths) {
					console.log(itempaths.length);

					// Go through all our itempaths and try to create them into
					// actual items. Some may fail, and that's why we have to settle.
					//when.promise(function (resolve, reject, notify) {

					return when.settle(
						when.map(itempaths, function (itempath, i) {
							return utils.createItem(path.join(options.items, itempath), options, itemFactory);
							//return when.try(utils.createItem, path.join(options.items, itempath), options, itemFactory);
						})
					)
					.then(function (descriptors) {
						var items = [];

						descriptors.forEach(function (d) {
							if (d.state === 'rejected') {
								console.log(d);
							} else {
								items.push(d.value);
							}
						});
						return items;
					}).then(function(items) {
						return when.filter(items, function (item) {
							return typeof(item) !== 'undefined';
						});
					});
				})
				.then(function (items) {
					console.log('items', items.length);

					items.forEach(function (i) { console.log(i.title); });
				});
		});

		if (callback) {
			promise.then(callback.bind(undefined, undefined));
		}

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
			sourcepath = wallery.items[slug].sourcepath,
			filename = utils.getThumbnailFilename(
				wallery.options.thumbnailDirectory,
				sourcepath,
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
					path.join(wallery.options.items, sourcepath),
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

