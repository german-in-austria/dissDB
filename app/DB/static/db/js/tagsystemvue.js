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
			loadingPresets: true,
			aTags: this.tags || []
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
				console.log('Base aus Cache ...');
				this.loadingBase = false;
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
				console.log('Tags aus Cache ...');
				this.loadingTags = false;
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
				console.log('Presets aus Cache ...');
				this.loadingPresets = false;
			}
		},
		addEbene: function () {
			this.aTags.push({'e': 0, 'tags': []});
			this.$emit('tags', this.aTags);
		}
	},
	mounted: function () {
		console.log('Tagsystem mounted ...');
		this.getBase();
		this.getPresets();
	}
});

/* Tags */
Vue.component('tagsystemtags', {
	delimiters: ['${', '}'],
	template: '#tagsystem-tags-template',
	props: ['generation', 'ebene', 'tags', 'parents'],
	data: function () {
		return {
			cache: tagsystemCache,
			aTags: this.tags || [],
			aParents: this.parents || []
		};
	},
	computed: {
	},
	watch: {
	},
	methods: {
		// editTag: function (aVal) {
		// 	console.log('tagsystemtags');
		// 	console.log(aVal);
		// }
	},
	mounted: function () {
	}
});

/* Tags */
Vue.component('tagsystemselecttag', {
	delimiters: ['${', '}'],
	template: '#tagsystem-selecttag-tags-template',
	props: ['generation', 'ebene', 'tags', 'parents'],
	data: function () {
		return {
			cache: tagsystemCache,
			aTags: this.tags || [],
			aParents: this.parents || [],
			isOpen: false
		};
	},
	methods: {
		ptagsbtn: function (tagId) {
			this.isOpen = false;
			console.log(this.aTags.push({'tag': tagId, 'tags': []}));
			console.log('Tag mit ID ' + tagId + ' hinzufügen ...');
		},
		seltags: function () {
			this.isOpen = true;
			this.$nextTick(() => this.$refs.ptagsbtn[0].focus());
		},
		seltagsBlur: function () {
			this.$nextTick(function () {
				if (this.$refs.ptagsbtn.indexOf(document.activeElement) < 0) {
					this.isOpen = false;
				}
			});
		}
	}
});
