/* global _ d3 csrf Vue alert performance */

class TranskriptClass {
	constructor (aTokenTypes = {}, aInformanten = {}, aSaetze = {}, aEvents = [], aTokens = {}, aTokenFragmente = {}) {
		this.aTokenTypes = aTokenTypes;
		this.aInformanten = aInformanten;
		this.aSaetze = aSaetze;
		this.aEvents = aEvents;
		this.aTokens = aTokens;
		this.aTokenFragmente = aTokenFragmente;
		this.debouncedRerenderEvents = _.debounce(this.rerenderEvents, 100);
		this.debouncedSVGHeight = _.debounce(this.svgHeight, 50);
	}
	reset () {
		this.aTokenTypes = {};
		this.aInformanten = {};
		this.aSaetze = {};
		this.aEvents = [];
		this.aTokens = {};
		this.aTokenFragmente = {};
		d3.select('#annotationsvg').style('height', 'auto');
		d3.select('#svg-g-events').selectAll('*').remove();
		return true;
	}
	setInformanten (nInformanten) {
		this.aInformanten = {};
		Object.keys(nInformanten).map(function (key, i) {
			this.aInformanten[key] = nInformanten[key];
			this.aInformanten[key]['i'] = i;
		}, this);
	}
	addEvents (nEvents) {
		nEvents.forEach(function (val) {
			this.updateEvent(0, val);
		}, this);
	}
	updateEvent (index = 0, values) {
		if (index === 0) {
			index = this.aEvents.push(values) - 1;
			this.aEvents[index]['family'] = [index];
			this.setRerenderEvent(index);
		} else {
			index = parseInt(index);
			this.aEvents[index] = values;
			this.aEvents[index]['family'] = [index];
			this.setRerenderEvent(index);
		}
		Object.keys(this.aEvents).map(function (key) {
			key = parseInt(key);
			if (key !== index && this.aEvents[key]['s'] === this.aEvents[index]['s']) {
				if (this.aEvents[index]['family'].indexOf(key) < 0) {
					this.aEvents[index]['family'].push(key);
					this.aEvents[index]['family'].sort();
				}
				if (this.aEvents[key]['family'].indexOf(index) < 0) {
					this.aEvents[key]['family'].push(index);
					this.aEvents[key]['family'].sort();
					this.setRerenderEvent(key);
				}
			}
		}, this);
	}
	setRerenderEvent (key) {
		this.aEvents[key]['rerender'] = true;
		this.debouncedRerenderEvents();
	}
	svgHeight () {
		d3.select('#annotationsvg').style('height', d3.select('#svg-g-transcript').node().getBBox().height + 50);
	}
	rerenderEvents () {
		var t0 = performance.now();
		this.aEvents.forEach(function (val, key) {
			this.rerenderEvent(key);
		}, this);
		this.debouncedSVGHeight();
		var t1 = performance.now();
		console.log('rerenderEvents: ' + Math.ceil(t1 - t0) + ' ms');
	}
	rerenderEvent (key, rePos = false) {
		var firstFamily = this.aEvents[key]['family'][0];
		if (this.aEvents[key]['rerender']) {
			// Passende SVG-Gruppe laden/erstellen
			if (!this.aEvents[firstFamily]['f-svg']) {
				this.aEvents[firstFamily]['f-svg'] = d3.select('#svg-g-events').append('g');
				this.aEvents[firstFamily]['f-svg'].append('rect').attr('class', 'ebg')
					.attr('x', 0).attr('y', 0)
					.attr('width', 10).attr('height', 10);
			}
			this.aEvents[key]['family'].forEach(function (fKey, i) {
				if (this.aEvents[fKey]['svg']) {
					this.aEvents[fKey]['svg'].selectAll('*').remove();
				} else {
					this.aEvents[fKey]['svg'] = this.aEvents[firstFamily]['f-svg'].append('g');
				}
				// Inhalt
				Object.keys(this.aEvents[fKey]['tid']).map(function (ikey) {
					if (!this.aEvents[fKey]['tid-svg']) {
						this.aEvents[fKey]['tid-svg'] = {};
					}
					if (this.aEvents[fKey]['tid-svg'][ikey]) {
						this.aEvents[fKey]['tid-svg'][ikey].selectAll('*').remove();
					} else {
						this.aEvents[fKey]['tid-svg'][ikey] = this.aEvents[fKey]['svg'].append('g');
					}
					this.aEvents[fKey]['tid-svg'][ikey].append('rect').attr('class', 'ibg');
					this.aEvents[fKey]['tid-svg'][ikey].attr('transform', 'translate(0,' + (2 + this.aInformanten[ikey]['i'] * 44) + ')');
					var lxw = 5;
					this.aEvents[fKey]['tid'][ikey].forEach(function (tKey) {
						var atxt = this.aEvents[fKey]['tid-svg'][ikey].append('g');
						atxt.append('text').attr('x', lxw).attr('y', 15).text(this.aTokens[tKey]['t']);
						atxt.append('text').attr('x', lxw).attr('y', 35).text(this.aTokens[tKey]['to']);
						lxw = lxw + atxt.node().getBBox().width + 5;
					}, this);
					var aBBox = this.aEvents[fKey]['tid-svg'][ikey].node().getBBox();
					this.aEvents[fKey]['tid-svg'][ikey].select('rect.ibg').attr('x', 2).attr('y', 0).attr('width', aBBox.width + 5).attr('height', aBBox.height + 2);
				}, this);
				// Erledigt
				this.aEvents[fKey]['rerender'] = false;
			}, this);
			var aBBox = this.aEvents[firstFamily]['f-svg'].node().getBBox();
			this.aEvents[firstFamily]['f-svg'].select('rect.ebg')
				.attr('width', aBBox.width + 2)
				.attr('height', aBBox.height + 2);
			this.aEvents[firstFamily]['pos'] = {'x': 10, 'y': 10 + firstFamily * 100, 'w': aBBox.width + 2, 'h': aBBox.height + 2};
			this.aEvents[firstFamily]['f-svg'].attr('transform', 'translate(' + this.aEvents[firstFamily]['pos']['x'] + ',' + this.aEvents[firstFamily]['pos']['y'] + ')');
		};
	}
	addTokens (nTokens) {
		Object.keys(nTokens).map(function (key, i) {
			this.updateToken(key, nTokens[key]);
		}, this);
	}
	updateToken (key, values) {
		this.aTokens[key] = values;
		if (this.aTokens[key]['fo']) {
			this.updateTokenFragment(key, this.aTokens[key]['fo']);
		};
		if (this.aEvents[this.aTokens[key]['e']]) {
			this.setRerenderEvent(this.aTokens[key]['e']);
		}
	}
	updateTokenFragment (key, fo) {
		if (this.aTokenFragmente[fo]) {
			if (this.aTokenFragmente[fo].indexOf(key) < 0) {
				this.aTokenFragmente[fo].push(key);
			}
		} else {
			this.aTokenFragmente[fo] = [key];
		}
	}
};

var transkript = new TranskriptClass();

var annotationsTool = new Vue({
	el: '#annotationsTool',
	delimiters: ['${', '}'],
	http: {
		root: '/annotationsdb/startvue',
		headers: {
			'X-CSRFToken': csrf
		},
		emulateJSON: true
	},
	data: {
		loading: true,
		menue: {
			informantenMitTranskripte: [],
			aInformant: 0,
			aTranskripte: []
		},
		annotationsTool: {
			aPK: 0,
			nNr: 0,
			loaded: false
		},
		message: null
	},
	mounted: function () {
		this.getMenue();
	},
	methods: {
		/* getTranskript: Läd aktuelle Daten des Transkripts für das Annotations Tool */
		getTranskript: function (aPK, aType = 'start', aNr = 0) {
			console.log('Lade Datensatz ' + aNr + ' von pk: ' + aPK + ' ...');
			if (aType === 'start') {
				this.loading = true;
				this.annotationsTool = {
					aPK: aPK,
					nNr: 0,
					loaded: false
				};
				transkript.reset();
			}
			this.$http.post('',
				{
					getTranskript: aPK,
					aType: aType,
					aNr: aNr
				})
			.then((response) => {
				if (aPK === this.annotationsTool.aPK) {
					if (aType === 'start') {
						transkript['aTokenTypes'] = response.data['aTokenTypes'];
						transkript.setInformanten(response.data['aInformanten']);
						transkript['aSaetze'] = response.data['aSaetze'];
					}
					transkript.addTokens(response.data['aTokens']);
					transkript.addEvents(response.data['aEvents']);
					this.loading = false;
					if (this.annotationsTool.nNr === response.data['nNr']) {
						this.annotationsTool.nNr = response.data['nNr'];
						this.annotationsTool.loaded = true;
						console.log('Alle Datensätze geladen.');
					} else if (this.annotationsTool.loaded === false) {
						this.annotationsTool.nNr = response.data['nNr'];
						this.getTranskript(this.annotationsTool.aPK, 'next', this.annotationsTool.nNr);
					}
				}
			})
			.catch((err) => {
				console.log(err);
				this.annotationsTool = {
					aPK: 0,
					nNr: 0,
					loaded: false
				};
				alert('Fehler!');
				this.loading = false;
			});
		},
		/* getMenue: Läd aktuelle Daten für das Menü */
		getMenue: function () {
			this.loading = true;
			this.$http.post('',
				{
					getMenue: 1,
					ainformant: this.menue.aInformant
				})
			.then((response) => {
				this.menue = {
					informantenMitTranskripte: response.data['informantenMitTranskripte'],
					aInformant: response.data['aInformant'],
					aTranskripte: response.data['aTranskripte']
				};
				this.loading = false;
			})
			.catch((err) => {
				console.log(err);
				alert('Fehler!');
				this.loading = false;
			});
		}

	}
});
