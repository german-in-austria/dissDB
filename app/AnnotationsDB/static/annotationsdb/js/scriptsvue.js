/* global csrf Vue alert */

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
			loaded: false,
			aTokenTypes: {},
			aInformanten: {},
			aSaetze: {},
			aEvents: [],
			aTokens: {}
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
					loaded: false,
					aTokenTypes: {},
					aInformanten: {},
					aSaetze: {},
					aEvents: [],
					aTokens: {}
				};
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
						this.annotationsTool.aTokenTypes = response.data['aTokenTypes'];
						this.annotationsTool.aInformanten = response.data['aInformanten'];
						this.annotationsTool.aSaetze = response.data['aSaetze'];
					}
					// this.annotationsTool.aTokens = Object.assign({}, this.annotationsTool.aTokens, response.data['aTokens']);
					var athis = this;
					Object.keys(response.data['aTokens']).map(function (key, i) {
						athis.$set(athis.annotationsTool.aTokens, key, response.data['aTokens'][key]);
						athis.updateToken(key);
					});
					this.annotationsTool.aEvents.push.apply(this.annotationsTool.aEvents, response.data['aEvents']);
					// console.log(response.data);
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
		updateToken: function (key) {
			this.$set(this.annotationsTool.aTokens[key], 't-w', this.getTextWidth(this.annotationsTool.aTokens[key]['t'], false));
			if (this.annotationsTool.aTokens[key]['o']) {
				this.$set(this.annotationsTool.aTokens[key], 'o-w', this.getTextWidth(this.annotationsTool.aTokens[key]['o'], false));
			}
			this.$set(this.annotationsTool.aTokens[key], 'to-w', this.getTextWidth(this.annotationsTool.aTokens[key]['to'], false));
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
