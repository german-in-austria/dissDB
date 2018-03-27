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
		message: null
	},
	mounted: function () {
		this.getMenue();
	},
	methods: {
		/* getTranskript: Läd aktuelle Daten des Transkripts für das Annotations Tool */
		getTranskript: function (aPK, aType = 'start', aNr = 0) {
			this.loading = true;
			if (aType === 'start') {
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
				if (aType === 'start') {
					this.annotationsTool.aTokenTypes = response.data['aTokenTypes'];
					this.annotationsTool.aInformanten = response.data['aInformanten'];
					this.annotationsTool.aSaetze = response.data['aSaetze'];
				}
				if (this.annotationsTool.nNr === response.data['nNr']) {
					this.annotationsTool.loaded = true;
				}
				this.annotationsTool.nNr = response.data['nNr'];
				this.annotationsTool.aEvents.push.apply(this.annotationsTool.aEvents, response.data['aEvents']);
				this.annotationsTool.aTokens = Object.assign({}, this.annotationsTool.aTokens, response.data['aTokens']);
				console.log(response.data);
				this.loading = false;
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
