var _ = require('lodash'),
	utils = require('./utils');

function QueryWrapper (items, cache) {
	this.items = items;
	this.cache = cache;
}

QueryWrapper.prototype = {
	tag: function (tag) {
		return new QueryWrapper(_.filter(this.items, function (item) {
			return _.indexOf(item.tags, tag) > -1;
		}), this.cache);
	},

	sort: function (by) {
		var items = utils.sortItems(this.items, by);
		return new QueryWrapper(items, this.cache);
	},

	values: function () {
		return this.items;
	}
};

module.exports = QueryWrapper;
