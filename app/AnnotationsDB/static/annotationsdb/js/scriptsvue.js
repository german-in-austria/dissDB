/* global csrf Vue */

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
			aTokenTypes: [],
			aSaetze: [],
			aEvents: [],
			aInformanten: [],
			aTokens: []
		},
		message: null
	},
	mounted: function () {
		this.getMenue();
	},
	methods: {
		getTranskript: function (aPK, aType = 'start', aNr = 0) {
			this.loading = true;
			if (aType === 'start') {
				this.annotationsTool = {
					aTokenTypes: [],
					aSaetze: [],
					aEvents: [],
					aInformanten: [],
					aTokens: []
				};
			}
			this.$http.post('',
				{
					getTranskript: aPK,
					aType: aType,
					aNr: aNr
				})
			.then((response) => {
				this.loading = false;
				console.log(response.data);
			})
			.catch((err) => {
				this.loading = false;
				console.log(err);
			});
		},
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
				this.loading = false;
				console.log(err);
			});
		}
	}
});
