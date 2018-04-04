/* global _ $ d3 csrf Vue alert performance */

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
				}
				if (this.aEvents[key]['family'].indexOf(index) < 0) {
					this.aEvents[key]['family'].push(index);
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
		if (this.aEvents[key]['rerender']) {
			// Passende SVG-Gruppe laden/erstellen
			if (this.aEvents[key]['svg']) {
				this.aEvents[key]['svg'].selectAll('*').remove();
			} else {
				this.aEvents[key]['svg'] = d3.select('#svg-g-events').append('g');
			}
			// Inhalte
			this.aEvents[key]['svg'].append('text').attr('x', 0).attr('y', 15).text(JSON.stringify(this.aEvents[key]['tid']));
			// Box um Event hinzufügen
			var aBBox = this.aEvents[key]['svg'].node().getBBox();
			this.aEvents[key]['svg'].append('rect')
				.attr('x', -5).attr('y', -5)
				.attr('width', aBBox.width + 10).attr('height', aBBox.height + 10);
			this.aEvents[key]['rerender'] = false;
			rePos = true;
		};
		if (rePos) {
			var sBBox = this.aEvents[key]['svg'].node().getBBox();
			if (this.aEvents[key - 1]) {
				this.aEvents[key]['pos'] = {'x': 10, 'y': this.aEvents[key - 1]['pos']['y'] + this.aEvents[key - 1]['pos']['h'] + 1, 'w': sBBox.width, 'h': sBBox.height};
			} else {
				this.aEvents[key]['pos'] = {'x': 10, 'y': 50, 'w': sBBox.width, 'h': sBBox.height};
			}
			this.aEvents[key]['svg'].attr('transform', 'translate(' + this.aEvents[key]['pos']['x'] + ',' + this.aEvents[key]['pos']['y'] + ')');
		}
	}
	addTokens (nTokens) {
		var aError = '';
		Object.keys(nTokens).map(function (key, i) {
			this.updateToken(key, nTokens[key]);
		}, this);
		if (aError) {
			console.log(aError);
			return false;
		} else {
			return true;
		}
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
						transkript['aInformanten'] = response.data['aInformanten'];
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
