/* global _ $ d3 csrf Vue alert performance */

const eEventHeight = 160;
const eInfHeight = 60;

class TranskriptClass {
	constructor (aTokenTypes = {}, aInformanten = {}, aSaetze = {}, aEvents = [], aTokens = {}, aTokenFragmente = {}, tEvents = [], zeilenTEvents = [], zeilenTEventsRefresh = true, zeilenHeight = 0, d3eventsize = {}) {
		this.aTokenTypes = aTokenTypes;
		this.aInformanten = aInformanten;
		this.aSaetze = aSaetze;
		this.aEvents = aEvents;
		this.tEvents = tEvents;
		this.aTokens = aTokens;
		this.aTokenFragmente = aTokenFragmente;
		this.debouncedPrerenderEvents = _.debounce(this.prerenderEvents, 100);
		this.debouncedSVGHeight = _.debounce(this.svgHeight, 50);
		this.zeilenTEvents = zeilenTEvents;
		this.zeilenTEventsRefresh = zeilenTEventsRefresh;
		this.zeilenHeight = zeilenHeight;
		this.d3eventsize = d3eventsize;
	}
	reset () {
		this.aTokenTypes = {};
		this.aInformanten = {};
		this.aSaetze = {};
		this.aEvents = [];
		this.tEvents = [];
		this.aTokens = {};
		this.aTokenFragmente = {};
		this.zeilenTEvents = [];
		this.zeilenTEventsRefresh = true;
		this.zeilenHeight = 0;
		this.d3eventsize = d3.select('#svg-g-eventsize');
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
			this.setRerenderEvent(index);
		} else {
			index = parseInt(index);
			this.aEvents[index] = values;
			this.setRerenderEvent(index);
		}
		// tEvetns erstellen/updaten
		var newTEvent = true;
		Object.keys(this.tEvents).map(function (key) {
			if (this.tEvents[key]) {
				if (this.tEvents[key]['s'] === this.aEvents[index]['s'] && this.tEvents[key]['e'] === this.aEvents[index]['e']) {
					// console.log('update tEvent');
					Object.keys(this.aEvents[index].tid).map(function (xKey, i) {
						this.tEvents[key]['eId'][xKey] = index;
						this.tEvents[key]['rerender'] = true;
					}, this);
					newTEvent = false;
				}
			}
		}, this);
		if (newTEvent) {
			var atEvent = {
				s: this.aEvents[index]['s'],
				e: this.aEvents[index]['e'],
				rerender: true,
				eId: {}
			};
			Object.keys(this.aEvents[index].tid).map(function (key, i) {
				atEvent['eId'][key] = index;
			}, this);
			this.tEvents.push(atEvent);
		}
	}
	setRerenderEvent (key) {
		this.aEvents[key]['rerender'] = true;
		this.debouncedPrerenderEvents();
	}
	svgHeight () {
		d3.select('#annotationsvg').style('height', this.zeilenHeight + 50);
		this.scrollRendering();
	}
	prerenderEvents () {
		var t0 = performance.now();
		this.tEvents.forEach(function (val, key) {
			this.preRenderTEvent(key);
		}, this);
		this.debouncedSVGHeight();
		this.updateZeilenTEvents();
		var t1 = performance.now();
		console.log('prerenderEvents: ' + Math.ceil(t1 - t0) + ' ms');
	}
	preRenderTEvent (key) {
		if (this.tEvents[key]['rerender']) {
			this.renderTEvent(key, this.d3eventsize, true);
			this.tEvents[key]['svgWidth'] = this.d3eventsize.node().getBBox().width + 15;
			this.tEvents[key]['rerender'] = false;
		}
	}
	updateZeilenTEvents () {
		this.zeilenTEventsRefresh = true;
		var mWidth = $('#annotationsvg').width() - 10;
		var aWidth = 0;
		this.zeilenTEvents = [{'eId': [], 'eH': 0}];
		var aZTEv = 0;
		this.zeilenHeight = 0;
		this.tEvents.forEach(function (val, key) {
			aWidth += val['svgWidth'];
			if (aWidth < mWidth) {
				this.zeilenTEvents[aZTEv]['eId'].push(key);
				if (eEventHeight > this.zeilenTEvents[aZTEv]['eH']) {
					this.zeilenTEvents[aZTEv]['eH'] = eEventHeight;
				}
			} else {
				this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
				aWidth = val['svgWidth'];
				aZTEv++;
				this.zeilenTEvents[aZTEv] = {'eId': [key], 'eH': eEventHeight};
			}
		}, this);
		this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
	}
	renderTEvent (key, d3target, fast = false) {
		d3target.selectAll('*').remove();
		var bW = 0;
		Object.keys(this.aInformanten).map(function (iKey, iI) {	// Informanten durchzählen
			var d3eInf = d3target.append('g').attr('transform', 'translate(0,' + (iI * (eInfHeight + 2)) + ')');
			if (!fast) {
				d3eInf.append('rect').attr('x', 0).attr('y', 0).attr('width', 10).attr('height', eInfHeight - 10);
			}
			Object.keys(this.tEvents[key]['eId']).map(function (eKey, eI) {
				if (eKey === iKey) {
					var aEvent = this.aEvents[this.tEvents[key]['eId'][eKey]];
					var aTokensIds = aEvent['tid'][iKey];
					var aX = 1;
					aTokensIds.forEach(function (aTokenId) {
						var d3aToken = d3eInf.append('g').attr('transform', 'translate(' + aX + ',1)');
						if (!fast) {
							d3aToken.attr('class', 'eTok eTok' + aTokenId).attr('data-eTok', aTokenId);
							d3aToken.append('rect').attr('x', 0).attr('y', 0).attr('width', 1).attr('height', eInfHeight - 12);
						}
						d3aToken.append('text').attr('x', 1).attr('y', 18).text(this.aTokens[aTokenId]['t']);
						d3aToken.append('text').attr('x', 1).attr('y', 43).text(this.aTokens[aTokenId]['to']);
						aX += d3aToken.node().getBBox().width + 5; // Leerzeichen?!
						if (!fast) {
							d3aToken.select('rect').attr('width', d3aToken.node().getBBox().width + 1);
						}
					}, this);
				}
			}, this);
			if (!fast) {
				d3eInf.attr('class', 'eInf eInf' + iKey).attr('data-eInf', iKey);
				var aW = d3eInf.node().getBBox().width;
				if (aW > bW) {
					bW = aW;
				}
				d3eInf.select('rect').attr('width', bW + 1);
			}
		}, this);
		if (!fast) {
			d3target.selectAll('g.eInf>rect').attr('width', bW + 1);
		}
	}
	scrollRendering () {
		var t0 = performance.now();
		var mWidth = $('#annotationsvg').width() - 10;
		if (this.zeilenTEventsRefresh) {
			d3.select('#svg-g-events').selectAll('*').remove();
			this.zeilenTEventsRefresh = false;
		}
		var sHeight = $('#svgscroller').height();
		var sPos = $('.mcon.vscroller').scrollTop() - 50;
		var sePos = sPos + sHeight + 100;
		var aTop = 0;
		var aBottom = 0;
		this.zeilenTEvents.forEach(function (val, key) {
			aBottom = aTop + sHeight;
			if (sePos >= aTop && sPos <= aBottom) {
				if (!val['d3obj']) {
					this.zeilenTEvents[key]['d3obj'] = d3.select('#svg-g-events')
																								.append('g').attr('class', 'eZeile').attr('data-eZeile', key)
																								.attr('transform', 'translate(0,' + aTop + ')');
					this.zeilenTEvents[key]['d3obj'].append('rect').attr('x', 0).attr('y', 0).attr('width', mWidth).attr('height', 140);
					var aX = 5;
					this.zeilenTEvents[key]['eId'].forEach(function (eVal, eKey) {
						this.renderTEvent(eVal, this.zeilenTEvents[key]['d3obj'].append('g').attr('class', 'tEvent').attr('data-tEvent', eVal).attr('transform', 'translate(' + aX + ',20)'));
						aX += this.tEvents[eVal]['svgWidth'];
					}, this);
				}
			} else {
				if (val['d3obj']) {
					this.zeilenTEvents[key]['d3obj'].remove();
					delete this.zeilenTEvents[key]['d3obj'];
				};
			}
			aTop += val['eH'];
		}, this);
		var t1 = performance.now();
		console.log('scrollRendering: ' + Math.ceil(t1 - t0) + ' ms');
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

document.addEventListener('scroll', function (event) {
	if (event.target.id === 'svgscroller') {
		transkript.scrollRendering();
	}
}, true);

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
