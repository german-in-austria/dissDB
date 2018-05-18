/* global _ Vue csrf alert confirm */

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
			aTags: this.tags || [],
			reRender: false
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
		},
		changeTag: function (aTags, tagIndex) {
			Vue.set(this.aTags[tagIndex].tags, _.clone(aTags));
			this.$emit('tags', this.aTags);
			this.reRender = true;
			this.$nextTick(() => { this.reRender = false; });
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
	props: ['generation', 'ebene', 'tags', 'parents', 'tagindex'],
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
		changeTag: function (aTags, tagIndex) {
			Vue.set(this.aTags[tagIndex].tags, _.clone(aTags));
			this.$emit('changetag', this.aTags, this.tagindex);
		},
		movetag: function (tagIndex, aDir) {
			this.aTags.splice(tagIndex + aDir, 0, this.aTags.splice(tagIndex, 1)[0]);
			this.$emit('changetag', this.aTags, this.tagindex);
		},
		deltag: function (tagIndex) {
			this.aTags.splice(tagIndex, 1);
			this.$emit('changetag', this.aTags, this.tagindex);
		}
	},
	mounted: function () {
	}
});

/* Tags */
Vue.component('tagsystemselecttags', {
	delimiters: ['${', '}'],
	template: '#tagsystem-selecttag-tags-template',
	props: ['generation', 'ebene', 'tags', 'parents', 'tag', 'tagindex', 'tagindexmax'],
	data: function () {
		return {
			cache: tagsystemCache,
			aTags: this.tags || [],
			aParents: this.parents || [],
			isOpen: false
		};
	},
	methods: {
		seltags: function () {
			this.isOpen = true;
		},
		closePtagsbtn: function () {
			this.isOpen = false;
		},
		changeTag: function (aTags, tagIndex) {
			this.$emit('changetag', aTags, tagIndex);
		},
		seltagsBlur: function () {
			this.$nextTick(function () {
				if (document.activeElement.className.indexOf('ptagsbtn')) {
					this.closePtagsbtn();
				}
			});
		},
		movetagleft: function () {
			this.$emit('movetag', this.tagindex, -1);
			this.closePtagsbtn();
		},
		movetagright: function () {
			this.$emit('movetag', this.tagindex, 1);
			this.closePtagsbtn();
		},
		deltag: function () {
			if (confirm('Sollen der Tag "' + this.cache.tagsCache.tags[this.tagindex].t + '" inkl. aller "Children" tatsächlich gelöscht werden?')) {
				this.$emit('deltag', this.tagindex);
			}
			this.closePtagsbtn();
		}
	},
	mounted: function () {
	}
});

Vue.component('tagsystemselecttag', {
	delimiters: ['${', '}'],
	template: '#tagsystem-selecttag-tag-template',
	props: ['generation', 'ebene', 'tags', 'parents', 'agen', 'tag', 'tagindex'],
	data: function () {
		return {
			cache: tagsystemCache,
			aTags: this.tags || [],
			aTag: this.tag || undefined,
			aParents: this.parents || []
		};
	},
	computed: {
		getATags: function () {
			var aTags = [];
			this.cache.tagsCache.tagsReihung.forEach(function (tId, key) {
				var cTag = this.cache.tagsCache.tags[tId];
				if (parseInt(this.generation) > 0) {
					if (parseInt(this.agen) === 0) {
						if (this.aParents[this.agen] === tId) {
							aTags.push({'tId': tId, 'p': true});
						} else {
							if ((cTag.g === null) && (!cTag.tezt || (cTag.tezt && cTag.tezt.indexOf(this.ebene) > -1))) {
								aTags.push({'tId': tId, 'a': true});
							}
						}
					} else {
						if (this.aParents[this.agen] === tId) {
							aTags.push({'tId': tId, 'p': true});
						} else {
							if (parseInt(this.generation) === parseInt(this.agen)) {
								if ((cTag.g === null || cTag.g === parseInt(this.agen)) &&
										(!cTag.tezt || (cTag.tezt && cTag.tezt.indexOf(this.ebene) > -1)) &&
										(this.cache.tagsCache.tags[this.aParents[this.agen - 1]] && this.cache.tagsCache.tags[this.aParents[this.agen - 1]].c && this.cache.tagsCache.tags[this.aParents[this.agen - 1]].c.indexOf(tId) > -1)) {
									aTags.push({'tId': tId, 'e': true});
								}
							}
						}
					}
				} else {
					if ((cTag.g === null || cTag.g === parseInt(this.generation)) && (!cTag.tezt || (cTag.tezt && cTag.tezt.indexOf(this.ebene) > -1)) && (!cTag.p)) {
						aTags.push({'tId': tId, 'b': true, 'g': cTag.g});
					}
				}
			}, this);
			return aTags;
		}
	},
	methods: {
		ptagsbtn: function (tagId) {
			if (this.aTag) {
				if (this.aTag !== tagId && ((!this.aTags.tags || this.aTags.tags.length < 1) ||	confirm('Sollen die "Children" tatsächlich gelöscht werden?'))) {
					this.aTags.tag = tagId;
					this.aTags.tags = [];
				}
			} else {
				this.aTags.push({'tag': tagId, 'tags': []});
			}
			this.$emit('changetag', this.aTags, this.tagindex);
			this.$emit('closePtagsbtn');
			console.log('Tag mit ID ' + tagId + ' hinzufügen ...');
		},
		seltagsBlur: function () {
			this.$nextTick(function () {
				if (document.activeElement.className.indexOf('ptagsbtn')) {
					this.$emit('closePtagsbtn');
				}
			});
		},
		closePtagsbtn: function () {
			this.$emit('closePtagsbtn');
		},
		changeTag: function (aTags, tagIndex) {
			this.$emit('changetag', aTags, tagIndex);
		}
	},
	mounted: function () {
		if (this.$refs.ptagsbtn) {
			this.$refs.ptagsbtn.some(function (aElement) {
				if ((aElement.className.indexOf('selected') >= 0 && this.tag) || (aElement.className.indexOf('parent') < 0 && !this.tag)) {
					this.$nextTick(() => aElement.focus());
					return true;
				}
			}, this);
		}
	}
});
