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
		message: null
	},
	mounted: function () {
		this.getMenue();
	},
	methods: {
		getMenue: function () {
			this.loading = true;
			this.$http.post('',
				{
					getMenue: 1,
					ainformant: this.menue.aInformant
				})
			.then((response) => {
				this.menue.informantenMitTranskripte = response.data['informantenMitTranskripte'];
				this.menue.aInformant = response.data['aInformant'];
				this.menue.aTranskripte = response.data['aTranskripte'];
				this.loading = false;
			})
			.catch((err) => {
				this.loading = false;
				console.log(err);
			});
		}
	}
});
