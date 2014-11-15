/*jslint node:true */
var
	_ = require('lodash'),
	fs = require('fs-then'),
	jsonFm = require('json-front-matter').parse,
	yamlFm = require('front-matter'),
	createDefaults = require('./defaults'),
	when = require('when'),
	path = require('path'),
	walk = require('walk'),
	gm = require('gm'),
	tinycolor2 = require('tinycolor2');


function pathify (dir, file) {
	if (file) {
		return path.normalize(path.join(dir, file));
	}
	return path.normalize(dir);
}
exports.pathify = pathify;


function slugify (str) {
	return str
		.toLowerCase()
		.replace(/[^\w- ]+/g, '')
		.replace(/ +/g, '_');
}
exports.slugify = slugify;


function processOptions (options) {
	return _.extend({}, createDefaults(), options || {});
}
exports.processOptions = processOptions;


function getItemPaths (dir) {
	var filename_re = /^([^\.]*)\.(\w+)$/;

	return fs.readdir(dir).then(function (files) {
		return when.filter(files, function (file) {
			return when.promise(function (resolve, reject) {
				// check file extension
				var parts = filename_re.exec(file);

				// only process paths with '.md' extensions
				if (parts && parts.length === 3 && parts[2] === 'md') {
					var path = pathify(dir, parts[1]);

					fs.exists(path, function (exists) {
						if (exists) {
							fs.stat(path, function (err, stats) {
								if (err) {
									reject(err);
								}
								resolve(stats.isDirectory());
							});
						} else {
							resolve(false);
						}
					});
				} else {
					resolve(false);
				}
			});
		});
	}).then(function (files) {
		return _.flatten(files);
	});
}
exports.getItemPaths = getItemPaths;


function createItem (filePath, options, itemFactory) {
	var fileName = path.basename(filePath);

	return fs.readFile(filePath, 'utf-8')
		.then(function (data) {
			var sourcepath = /^([^\.]+)/.exec(fileName)[1],
				parsed,
				body,
				item;

			try {
				parsed = (options.metaFormat === 'yaml' ? yamlFm : jsonFm)(data);
			} catch (e) {
				throw e;
			}

			body = parsed.body;
			item = itemFactory ? itemFactory(parsed.attributes) : parsed.attributes;

			item.date = new Date(item.date);
			item.content = body;
			item.sourcepath = sourcepath;
			item.slug = slugify(item.slug || item.title || sourcepath);

			item.tags = _.compact(_.map((item.tags || '').split(','), function (x) {
				return x.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			})).sort();

			return item;
		}).then(null, function (err) {
			console.log("There was a problem reading metadata for " + fileName + err);
			return;
		});
}
exports.createItem = createItem;


function sortItems (items, field) {
  var reverse;

	field = field || '-date';
	reverse = field.charAt(0) === '-';
	field = field.replace(/\-/, '');

	items = Object.keys(items).map(function (item) { return items[item]; })
		.sort(function (a, b) {
			if (a[field] > b[field]) { return 1; }
			if (a[field] < b[field]) { return -1; }
			return 0;
		});

	if (reverse) {
	items.reverse();
	}

	return items;
}
exports.sortItems = sortItems;


function getTags (items) {
	var tags = items.reduce(function (tags, item) {
		if (!item.tags || !Array.isArray(item.tags)) { return tags; }
		return tags.concat(item.tags);
	}, []);

	return _.unique(tags).sort();
}
exports.getTags = getTags;


function parseThumbnailName(str) {
	return _.object(['size', 'format'], str.split('.'));
}
exports.parseThumbnailName = parseThumbnailName;


function getThumbnailFilename(thumbnailPath, slug, size, format) {
	return path.normalize(path.join(thumbnailPath, 'wtn_' + slug + '_' + size + '.' + format));
}
exports.getThumbnailFilename = getThumbnailFilename;


// Resizes thumbnail using source, placing in dest, using
// options to determine appearance of thumbnail image
function makeThumbnail(srcPath, dstPath, options) {
	return when.promise(function (resolve, reject) {

		gm(srcPath)
			.size(function (err, size) {
				var srcRatio = size.width / size.height,
					dstRatio = options.width / options.height,
					scale, cropx, cropy;

					if (options.width && options.height) {
						if (dstRatio >= srcRatio) {
							scale = options.width / size.width;
						} else {
							scale = options.height / size.height;
						}

						cropx = ((size.width * scale) - options.width) * 0.5;
						cropy = ((size.height * scale) - options.height) * 0.5;

						this.resize(size.width * scale, size.height * scale);
						this.crop(options.width, options.height, cropx, cropy);
					} else {
						this.resize(options.width, options.height);
					}
					this.write(dstPath, function (err) {
						if (err) { return reject(err); }
						resolve(dstPath);
					});

			});
	});
}
exports.makeThumbnail = makeThumbnail;


// Find an appropriate image within the source path
// that would be suitable for a thumbnail source
function getThumbnailSource(srcPath, fallbackFormats) {
	// extract file extension from filename
	var fileext = function (s) {
		return (/^[^\.]+\.?(.*)?$/).exec(s.toLowerCase())[1];
	};

	return when.promise(function (resolve, reject, notify) {
		// try to find a preview.png
		fs.stat(path.normalize(path.join(srcPath, 'preview.png')))
			.then(function (stats) {
				// preview.png found, use it!
				resolve([path.join(srcPath, 'preview.png')]);
			}, function () {
				// no preview.png, look for another reasonable source
				var walker = walk.walk(path.normalize(srcPath)),
					matches = [];

				walker.on('file', function (root, fileStats, next) {
					// only store items with permitted file extensions
					if (fallbackFormats.indexOf(fileext(fileStats.name)) > -1) {
						matches.push(path.join(root, fileStats.name));
					}
					next();
				});

				walker.on('end', function () {
					resolve(matches);
				});
			});
	}).then(function (matches) {
		if (matches.length === 0) {
			console.debug();
		}

		var fileext = function (s) { return /^[^\.]+\.?(.*)?$/.exec(s.toLowerCase())[1]; },
			numFormats = fallbackFormats.length,
			formats = fallbackFormats.slice(0).reverse();

		matches.sort(function (a, b) {
			var aidx = formats.indexOf(fileext(a)),
				bidx = formats.indexOf(fileext(b));

			if (aidx > bidx) return -1;
			if (aidx < bidx) return 1;
			return 0;
		});

		return matches[0];
	});
}
exports.getThumbnailSource = getThumbnailSource;

function analyzeColors(srcPath, fallbackFormats, count) {
	count = count || 1;
	return getThumbnailSource(srcPath, fallbackFormats)
		.then(function (source) {
			return when.promise(function (resolve, reject, notify) {
				gm(source)
					.resize(count, count, '!')
					.write('txt:-', function (err, stdout, stderr, cmd) {
						if (err) {
							console.error("error running gm, maybe graphicsmagick isn't installed?");
							return reject(err);
						}


						resolve(_.map(stdout.split('\n'), function (row) {
							var match = /#[0-9a-f]{6}/i.exec(row);
							return match ? match[0] : undefined;
						}));
					});
			});
		});
}
exports.analyzeColors = analyzeColors;


// get a list of available downloadable files for the given
// wallery item

function getDownloads(srcPath, srcName, allowedFormats) {
	var fileext = function (s) { return /^[^\.]+\.?(.*)?$/.exec(s.toLowerCase())[1]; };

	return when.promise(function (resolve, reject, notify) {
		var walker = walk.walk(path.normalize(path.join(srcPath, srcName))),
			matches = [];

		walker.on('file', function (root, fileStats, next) {
			if (fileStats.name !== 'preview.png' &&
				allowedFormats.indexOf(fileext(fileStats.name) > -1)
			) {
				matches.push({
					bytes: fileStats.size,
					path: path.join(root, fileStats.name),
					filename: fileStats.name,
					ext: fileext(fileStats.name)
				});
			}
			next();
		});

		walker.on('end', function () {
			resolve(matches);
		});
	}).then(function (items) {
		return when.map(items, function (item) {
			return when.promise(function (resolve, reject, notify) {
				var info = {};

				gm(item.path)
					.size(function (err, geometry) {
						// Graphicsmagick has some issues with SVG files, so
						// we have to fall back to calling the much slower identify()
						// and parse out the dimensions manually

						if (typeof(geometry) === 'undefined') {
							this.identify(function (err, info) {

								if (err || typeof(info['Geometry']) === 'undefined') {
									geometry = {width: 0, height: 0};
								} else {
									geometry = _.object(
										['width', 'height'],
										_.map(info['Geometry'].split('x'), function (x) {
											return parseInt(x, 10);
										})
									);
								}

								return resolve(_.extend(item, {geometry: geometry}));
							});
						} else {
							return resolve(_.extend(item, {geometry: geometry}));
						}
					});

			});

		});
	}).then(function (items) {
		// calculate ratios
		return when.map(items, function (item) {
			if (item.geometry.width === 0 || item.geometry.height === 0) {
				item.aspectratio = {width:'?', height:'?'}; //undefined;
				return item;
			}

			var gcd = function (a, b) {
				if (!b) return a;
				return gcd(b, a % b);
			},

			sizeGCD = gcd(item.geometry.width, item.geometry.height);

			item.aspectratio = {
				width: item.geometry.width / sizeGCD,
				height: item.geometry.height / sizeGCD,
			};

			return item;
		});

	});
}
exports.getDownloads = getDownloads;

function getDownloadPath (srcPath, slug, filename) {
	return path.join(srcPath, slug, filename);
}
exports.getDownloadPath = getDownloadPath;
