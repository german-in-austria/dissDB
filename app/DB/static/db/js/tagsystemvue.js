/* global Vue */

Vue.component('tagsystem', {
	delimiters: ['${', '}'],
	template: '#tagsystem-template',
	props: ['cols'],
	data: function () {
		return {
			colLeft: this.cols || 2
		};
	},
	computed: {
		colRight: function () {
			return 12 - this.colLeft;
		}
	},
	methods: {
	},
	mounted: function () {
	},
	beforeDestroy: function () {
	}
});
