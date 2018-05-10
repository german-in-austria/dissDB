/* global Vue csrf alert */

/* Cache für Tags und Presets */
const tagsystemCache = new Vue({data: { baseCache: undefined, tagsCache: undefined, presetsCache: undefined }});

/* Komponente für Tagsystem */
Vue.component('tagsystem', {
	delimiters: ['${', '}'],
	template: '#tagsystem-template',
	props: ['cols', 'tags'],
	http: {
		root: '/db/tagsystemvue',
		headers: {
			'X-CSRFToken': csrf
		},
		emulateJSON: true
	},
	data: function () {
		return {
			colLeft: this.cols || 2,
			cache: tagsystemCache,
			loadingBase: true,
			loadingTags: true,
			loadingPresets: true
		};
	},
	computed: {
		colRight: function () {
			return 12 - this.colLeft;
		}
	},
	watch: {
		tags: function (nVal, oVal) {
			this.getBase();
			this.getPresets();
		}
	},
	methods: {
		getBase: function () {
			if (!this.cache.baseCache) {
				console.log('Base laden ...');
				this.$http.post('',
					{
						getBase: 1
					})
				.then((response) => {
					this.loadingBase = false;
					this.cache.baseCache = response.data;
					this.getTags();
				})
				.catch((err) => {
					console.log(err);
					alert('Fehler!');
				});
			} else {
				console.log('Base aus cache ...');
				this.getTags();
			}
		},
		getTags: function () {
			if (!this.cache.tagsCache) {
				console.log('Tags laden ...');
				this.$http.post('',
					{
						getTags: 1
					})
				.then((response) => {
					this.loadingTags = false;
					this.cache.tagsCache = response.data['tags'];
				})
				.catch((err) => {
					console.log(err);
					alert('Fehler!');
				});
			} else {
				console.log('Tags aus cache ...');
			}
		},
		getPresets: function () {
			if (!this.cache.presetsCache) {
				console.log('Presets laden ...');
				this.$http.post('',
					{
						getPresets: 1
					})
				.then((response) => {
					this.loadingPresets = false;
					this.cache.presetsCache = response.data['presets'];
				})
				.catch((err) => {
					console.log(err);
					alert('Fehler!');
				});
			} else {
				console.log('Presets aus cache ...');
			}
		}
	},
	mounted: function () {
		console.log('Tagsystem mounted ...');
		this.getBase();
		this.getPresets();
	}
});
