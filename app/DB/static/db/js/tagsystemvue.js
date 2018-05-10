/* global Vue csrf alert */

/* Cache für Tags und Presets */
const tagsystemCache = new Vue({data: { tagsCache: {}, presetsCache: {} }});

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
			loadingTagEbenen: true,
			loadingTags: true,
			loadingPresets: true
		};
	},
	computed: {
		colRight: function () {
			return 12 - this.colLeft;
		}
	},
	methods: {
		getTagEbenen: function () {
			this.$http.post('',
				{
					getTagEbenen: 1
				})
			.then((response) => {
				this.loadingTagEbenen = false;
			})
			.catch((err) => {
				console.log(err);
				alert('Fehler!');
			});
		},
		getTags: function () {
			this.$http.post('',
				{
					getTags: 1
				})
			.then((response) => {
				this.loadingTags = false;
			})
			.catch((err) => {
				console.log(err);
				alert('Fehler!');
			});
		},
		getPresets: function () {
			this.$http.post('',
				{
					getPresets: 1
				})
			.then((response) => {
				this.loadingPresets = false;
			})
			.catch((err) => {
				console.log(err);
				alert('Fehler!');
			});
		}
	},
	mounted: function () {
		this.getTagEbenen();
		this.getTags();
		this.getPresets();
	}
});
