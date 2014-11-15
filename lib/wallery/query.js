var _ = require('lodash'),
	utils = require('./utils');

function QueryWrapper (items, cache) {
	this.items = items;
	this.cache = cache;
}

QueryWrapper.prototype = {
	tag: function (tag) {
		tag = _.flatten([tag]);
		return new QueryWrapper(_.filter(this.items, function (item) {
			return _.any(tag, function (t) {
				return _.indexOf(item.tags, t) > -1;
			});
		}), this.cache);
	},

	sort: function (by) {
		var items = utils.sortItems(this.items, by);
		return new QueryWrapper(items, this.cache);
	},

	first: function (count) {
		return new QueryWrapper(_.first(this.items, count), this.cache);
	},

	last: function (count) {
		return new QueryWrapper(_.last(this.items, count), this.cache);
	},

	without: function (item) {
		return new QueryWrapper(_.without(this.items, item), this.cache);
	},

	values: function () {
		return this.items;
	}
};

module.exports = QueryWrapper;
