/* global $ Vue csrf alert confirm stdfunctions */

/* Cache für Tags und Presets */
const tagsystemCache = new Vue({
	http: {
		root: '/db/tagsystemvue',
		headers: {
			'X-CSRFToken': csrf
		},
		emulateJSON: true
	},
	data: {
		baseCache: undefined,
		tagsCache: undefined,
		presetsCache: undefined,
		loadingBase: true,
		loadingTags: true,
		loadingPresets: true
	},
	watch: {
		presetsCache: function (nVal, oVal) {
			if (nVal) {
				nVal.forEach(function (val, key) {
					nVal[key].tags = this.processTags(val.tf).tags;
					nVal[key].tokenText = this.tagsText(nVal[key].tags);
					nVal[key].ze = [];
					nVal[key].tf.forEach(function (tVal) {
						if (this.tagsCache.tags[tVal.t].tezt) {
							this.tagsCache.tags[tVal.t].tezt.forEach(function (eVal) {
								if (nVal[key].ze.indexOf(eVal) < 0) {
									nVal[key].ze.push(eVal);
									this.$set(stdfunctions.getFirstObjectOfValueInPropertyOfArray(this.baseCache.tagebenen, 'pk', eVal), 'hasPresets', true);
								}
							}, this);
						}
					}, this);
				}, this);
			}
			return nVal;
		}
	},
	methods: {
		reset: function () {
			this.baseCache = undefined;
			this.tagsCache = undefined;
			this.presetsCache = undefined;
		},
		tagsText: function (aTags) {
			var aText = '';
			var aDg = 0;
			if (aTags) {
				aTags.forEach(function (val) {
					if (val.tag) {
						var sTags = this.tagsText(val.tags);
						aText += ((aDg === 0) ? ((aText.slice(-1) === ')') ? ' ' : '') : ', ') + this.tagsCache.tags[val.tag].t + ((sTags) ? '(' + sTags + ')' : '');
						aDg += 1;
					} else {
						aText += this.tagsText(val.tags);
					}
				}, this);
			}
			return aText;
		},
		processTags: function (pTags, pPos = 0, gen = 0) {
			var xTags = [];
			var xPos = pPos;
			var xClose = 0;
			while (xPos < pTags.length && xClose < 1) {
				if (pTags[xPos].c > 0) {
					xClose = pTags[xPos].c;
					pTags[xPos].c -= 1;
					xPos = xPos - 1;
				} else {
					var prData = this.processTags(pTags, xPos + 1);
					var zTags = prData.tags;
					var zPos = prData.pos;
					xTags.push({'id': 0, 'tag': pTags[xPos].t, 'tags': zTags});
					xPos = zPos + 1;
				}
			}
			return {'tags': xTags, 'pos': xPos};
		},
		getBase: function () {
			if (!this.baseCache) {
				console.log('Base laden ...');
				this.$http.post('',
					{
						getBase: 1
					})
				.then((response) => {
					this.baseCache = response.data;
					this.loadingBase = false;
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
			if (!this.tagsCache) {
				console.log('Tags laden ...');
				this.$http.post('',
					{
						getTags: 1
					})
				.then((response) => {
					this.tagsCache = response.data['tags'];
					this.loadingTags = false;
					this.getPresets();
				})
				.catch((err) => {
					console.log(err);
					alert('Fehler!');
				});
			} else {
				console.log('Tags aus Cache ...');
				this.loadingTags = false;
				this.getPresets();
			}
		},
		getPresets: function () {
			if (!this.presetsCache) {
				console.log('Presets laden ...');
				this.$http.post('',
					{
						getPresets: 1
					})
				.then((response) => {
					this.loadingPresets = false;
					this.presetsCache = response.data['presets'];
				})
				.catch((err) => {
					console.log(err);
					alert('Fehler!');
				});
			} else {
				console.log('Presets aus Cache ...');
				this.loadingPresets = false;
			}
		}
	}
});

/* Komponente für Tagsystem */
Vue.component('tagsystem', {
	delimiters: ['${', '}'],
	template: '#tagsystem-template',
	props: ['cols', 'tags'],
	data: function () {
		return {
			colLeft: this.cols || 2,
			cache: tagsystemCache,
			aTags: this.tags || [],
			showPresets: {},
			reRender: false
		};
	},
	computed: {
		colRight: function () {
			return 12 - this.colLeft;
		},
		loadingBase: function () {
			return this.cache.loadingBase;
		},
		loadingTags: function () {
			return this.cache.loadingTags;
		},
		loadingPresets: function () {
			return this.cache.loadingPresets;
		}
	},
	watch: {
		tags: function (nVal, oVal) {
			tagsystemCache.getBase();
		}
	},
	methods: {
		togglePreset: function (aEbeneIndex) {
			this.$set(this.showPresets, aEbeneIndex, !this.showPresets[aEbeneIndex]);
			this.$nextTick(() => $('.pretagsbtn:first-child').focus());
		},
		changeEbene: function () {
			this.$emit('tags', this.aTags);
		},
		addEbene: function () {
			this.aTags.push({'e': 0, 'tags': []});
			this.$emit('tags', this.aTags);
		},
		changeTag: function (aTags, tagIndex) {
			Vue.set(this.aTags[tagIndex].tags, JSON.parse(JSON.stringify(aTags)));
			this.$emit('tags', this.aTags);
			this.reRenderIt();
		},
		/* Sonsitge Funktionen: */
		ebeneVorhanden: function (eId) {
			var vorhanden = false;
			this.aTags.some(function (aEbene) {
				if (aEbene.e === eId) {
					vorhanden = true;
					return true;
				}
			}, this);
			return vorhanden;
		},
		selPresetBlur: function (e) {
			this.$nextTick(function () {
				if (document.activeElement.className.indexOf('pretagsbtn')) {
					this.showPresets = {};
				}
			});
		},
		addPreset: function (ebene, preset) {
			JSON.parse(JSON.stringify(this.cache.presetsCache[preset].tags)).forEach(function (val) {
				this.aTags[ebene].tags.push(val);
			}, this);
			this.changeTag(this.aTags[ebene].tags, ebene);
		},
		reRenderIt: function () {
			this.reRender = true;
			this.$nextTick(() => { this.reRender = false; });
		},
		getFirstObjectOfValueInPropertyOfArray: stdfunctions.getFirstObjectOfValueInPropertyOfArray
	},
	mounted: function () {
		console.log('Tagsystem mounted ...');
		tagsystemCache.getBase();
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
			Vue.set(this.aTags[tagIndex].tags, JSON.parse(JSON.stringify(aTags)));
			this.$emit('changetag', this.aTags, this.tagindex);
		},
		movetag: function (tagIndex, aDir) {
			this.aTags.splice(tagIndex + aDir, 0, this.aTags.splice(tagIndex, 1)[0]);
			this.$emit('changetag', this.aTags, this.tagindex);
		},
		deltag: function (tagIndex) {
			if (confirm('Sollen der Tag "' + this.cache.tagsCache.tags[this.aTags[tagIndex].tag].t + '" inkl. aller "Children" tatsächlich gelöscht werden?')) {
				this.aTags.splice(tagIndex, 1);
				this.$emit('changetag', this.aTags, this.tagindex);
			}
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
			this.$emit('deltag', this.tagindex);
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
				this.aTags.push({'id': 0, 'tag': tagId, 'tags': []});
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
