/* global csrf Vue alert */

class TranskriptClass {
	constructor (aTokenTypes = {}, aInformanten = {}, aSaetze = {}, aEvents = [], aTokens = {}, aTokenFragmente = {}) {
		this.aTokenTypes = aTokenTypes;
		this.aInformanten = aInformanten;
		this.aSaetze = aSaetze;
		this.aEvents = aEvents;
		this.aTokens = aTokens;
		this.aTokenFragmente = aTokenFragmente;
	}
	reset () {
		this.aTokenTypes = {};
		this.aInformanten = {};
		this.aSaetze = {};
		this.aEvents = [];
		this.aTokens = {};
		this.aTokenFragmente = {};
		return true;
	}
	addEvents (nEvents) {
		var aError = '';
		nEvents.forEach(function (val) {
			this.updateEvent(0, val);
		}, this);
		if (aError) {
			console.log(aError);
			return false;
		} else {
			return true;
		}
	}
	updateEvent (index = 0, values) {
		if (index === 0) {
			index = this.aEvents.push(values) - 1;
			this.aEvents[index]['family'] = [index];
			this.aEvents[index]['rerender'] = true;
		} else {
			index = parseInt(index);
			this.aEvents[index] = values;
			this.aEvents[index]['family'] = [index];
			this.aEvents[index]['rerender'] = true;
		}
		Object.keys(this.aEvents).map(function (key) {
			key = parseInt(key);
			if (key !== index && this.aEvents[key]['s'] === this.aEvents[index]['s']) {
				if (this.aEvents[index]['family'].indexOf(key) < 0) {
					this.aEvents[index]['family'].push(key);
				}
				if (this.aEvents[key]['family'].indexOf(index) < 0) {
					this.aEvents[key]['family'].push(index);
					this.aEvents[key]['rerender'] = true;
				}
			}
		}, this);
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
	}
	updateTokenFragment (key, fo) {
		if (this.aTokenFragmente[fo]) {
			this.aTokenFragmente[fo].push(key);
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
		getCharWidthCach: {},
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
		},
		/* Funktion zur ermittlung der Breite von Buchstaben im SVG-Element */
		getCharWidth: function (zeichen) {
			if (this.getCharWidthCach[zeichen]) {
				return this.getCharWidthCach[zeichen];
			} else {
				if (document.getElementById('svg-text-textsize')) {
					document.getElementById('svg-text-textsize').textContent = zeichen;
					this.getCharWidthCach[zeichen] = document.getElementById('svg-text-textsize').getBBox().width;
					if (this.getCharWidthCach[zeichen] === 0) {
						document.getElementById('svg-text-textsize').textContent = 'X' + zeichen + 'X';
						this.getCharWidthCach[zeichen] = document.getElementById('svg-text-textsize').getBBox().width - this.getCharWidth('X') * 2;
					}
					return this.getCharWidthCach[zeichen];
				}
			}
		},
		/* Funktion zur ermittlung der Breite von Texten im SVG-Element */
		getTextWidth: function (text, cached = true) {
			if (cached) {
				var w = 0;
				var i = text.length;
				while (i--) {
					w += this.getCharWidth(text.charAt(i));
				}
				if (w) {
					return w;
				}
			} else {
				if (document.getElementById('svg-text-textsize')) {
					document.getElementById('svg-text-textsize').textContent = text;
					return document.getElementById('svg-text-textsize').getBBox().width;
				}
			}
		}

	}
});
