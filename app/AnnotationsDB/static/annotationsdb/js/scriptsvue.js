/* global _ csrf Vue alert */

class TranskriptClass {
	constructor (aTokenTypes = {}, aInformanten = {}, aSaetze = {}, aEvents = [], aTokens = {}, aTokenFragmente = {}, aHeight = 0) {
		this.aTokenTypes = aTokenTypes;
		this.aInformanten = aInformanten;
		this.aSaetze = aSaetze;
		this.aEvents = aEvents;
		this.aTokens = aTokens;
		this.aTokenFragmente = aTokenFragmente;
		this.aHeight = aHeight;
		this.debouncedRerenderEvents = _.debounce(this.rerenderEvents, 100);
	}
	reset () {
		this.aTokenTypes = {};
		this.aInformanten = {};
		this.aSaetze = {};
		this.aEvents = [];
		this.aTokens = {};
		this.aTokenFragmente = {};
		this.aHeight = 0;
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
	rerenderEvents () {
		var oLen = this.aEvents.length;
		var rLen = 0;
		this.aEvents.forEach(function (val, key) {
			if (val['rerender']) {
				rLen += 1;
				this.aEvents[key]['rerender'] = false;
			};
		}, this);
		console.log('rerenderEvents: ' + rLen + ' / ' + oLen);
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
		this.aTokens[key]['w-t'] = getTextWidth(this.aTokens[key]['t']);
		this.aTokens[key]['w-to'] = getTextWidth(this.aTokens[key]['to']);
		if (this.aTokens[key]['o']) {
			this.aTokens[key]['w-o'] = getTextWidth(this.aTokens[key]['o']);
		}
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

/* Funktion zur ermittlung der Breite von Buchstaben im SVG-Element */
function getCharWidth (zeichen) {
	if (!getCharWidthCach[zeichen]) {
		if (document.getElementById('svg-text-textsize')) {
			document.getElementById('svg-text-textsize').textContent = zeichen;
			getCharWidthCach[zeichen] = document.getElementById('svg-text-textsize').getBBox().width;
			if (getCharWidthCach[zeichen] === 0) {
				document.getElementById('svg-text-textsize').textContent = 'X' + zeichen + 'X';
				getCharWidthCach[zeichen] = document.getElementById('svg-text-textsize').getBBox().width - getCharWidth('X') * 2;
			}
		}
	}
	return getCharWidthCach[zeichen];
};

/* Funktion zur ermittlung der Breite von Texten im SVG-Element */
var getCharWidthCach = {};
function getTextWidth (text, cached = false) {
	if (cached) {
		var w = 0;
		var i = text.length;
		while (i--) {
			w += getCharWidth(text.charAt(i));
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
