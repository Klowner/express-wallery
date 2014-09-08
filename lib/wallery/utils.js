var
	_ = require('lodash'),
	fs = require('fs-then'),
	jsonFm = require('json-front-matter').parse,
	yamlFm = require('front-matter'),
	createDefaults = require('./defaults'),
	when = require('when'),
	path = require('path'),
	walk = require('walk');

function processOptions (options) {
	return _.extend({}, createDefaults(), options || {});
}
exports.processOptions = processOptions;

function getItemPaths (dir) {
	var filename_re = /^([^\.]*)\.(\w+)$/;

	return fs.readdir(dir).then(function (files) {
		return when.filter(files, function (file) {
			// check file extension
			var parts = filename_re.exec(file);

			// only process paths with '.md' extensions
			if (parts && parts.length === 3 && parts[2] === 'md') {
				var path = pathify(dir, parts[1]);

				if (fs.existsSync(path)) {
				   var stats = fs.statSync(path);
				   if (stats.isDirectory()) {
					   return true;
				   }
			   }
			}
			return false;
		});

	}).then(function (files) {
		console.log('finished file search', files);
		return _.flatten(files);
	});
}
exports.getItemPaths = getItemPaths;


function getItem (filePath, options) {
	var fileName = path.basename(filePath);

	return fs.readFile(filePath, 'utf-8').then(function (data) {
		var parsed = (options.metaFormat === 'yaml' ? yamlFm : jsonFm)(data);
		var body = parsed.body;
		var item = parsed.attributes;

		item.date = new Date(post.date);
		item.content = body;

		item.slug = slugify(post.slug || post.title || fileName);

		return item;
	});
}
exports.getItem = getItem;


function sortItems (items) {
	return Object.keys(items).map(function (item) { return items[item]; })
		.sort(function (a, b) {
			if (a.date < b.date) return 1;
			if (a.date > b.date) return -1;
			return 0;
		});
};
exports.sortItems = sortItems;

function getTags (items) {
	var tags = items.reduce(function (tags, item) {
		if (!item.tags || !Array.isArray(post.tags)) return tags;
		return tags.concat(post.tags);
	}, []);

	return _.unique(tags).sort();
}
exports.getTags = getTags;


function pathify (dir, file) {
	if (file) {
		return path.normalize(path.join(dir, file));
	} else {
		return path.normalize(dir);
	}
}
exports.pathify = pathify;

function slugify (str) {
	return str
		.toLowerCase()
		.replace(/[^\w- ]+/g, '')
		.replace(/ +/g, '-');
}
exports.slugify = slugify;

function parseThumbnailName(str) {
	return _.object(['size', 'format'], str.split('.'));
}
exports.parseThumbnailName = parseThumbnailName;

// Resizes thumbnail using source, placing in dest, using
// options to determine appearance of thumbnail image
function makeThumbnail(srcPath, dstPath, options) {
	var method = (options.width && options.height) ? 'crop' : 'resize';

	return when.promise(function(resolve, reject, notify) {
		im[method](_.extend({}, options, {
			srcPath: srcPath,
			dstPath: dstPath
		}), function (err, stdout, stderr) {
			if (err) reject(err);
			resolve(path.normalize(dstPath));
		});
	});
}
exports.makeThumbnail = makeThumbnail;

// Find an appropriate image within the source path
// that would be suitable for a thumbnail source
function getThumbnailSource(srcPath, fallbackFormats) {
	// extract file extension from filename
	var fileext = function (s) { return /^[^\.]+\.?(.*)?$/.exec(s.toLowerCase())[1]; };

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
