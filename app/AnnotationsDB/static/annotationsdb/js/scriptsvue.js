/* global _ $ d3 csrf Vue alert performance */

document.addEventListener('scroll', function (event) {
	if (event.target.id === 'svgscroller') {
		annotationsTool.scrollRendering();
	}
}, true);

$(document).on('click', 'g.eTok', function (e) {
	var eTok = $(this).data('etok');
	annotationsTool.aTokens[eTok]['viewed'] = true;
	annotationsTool.d3TokenLastView = eTok;
	annotationsTool.aTokenInfo = _.clone(annotationsTool.aTokens[eTok]);
	annotationsTool.aTokenInfo['pk'] = eTok;
	annotationsTool.aTokenInfo['e-txt'] = annotationsTool.aEvents[searchbypk(annotationsTool.aTokens[eTok]['e'], annotationsTool.aEvents)]['s'];
	setTimeout(function () { $('#aTokenInfo').modal('show'); }, 20);
});

$(document).on('click', 'g.zInf', function (e) {
	annotationsTool.aInfInfo = $(this).data('zinf');
	setTimeout(function () { $('#aInformantenInfo').modal('show'); }, 20);
});

$(document).on('click', 'g.tEvent > .zeit', function (e) {
	annotationsTool.tEventInfo = $(this).parent().data('tevent');
	setTimeout(function () { $('#tEventInfo').modal('show'); }, 20);
});

// Wenn Modal angezeigt wird
$(document).on('shown.bs.modal', '#aTokenInfo', function (e) {
	$('#aTokenText').focus();
});

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
			loaded: true
		},
		aTokenTypes: {},
		aInformanten: {},
		aInfLen: 0,
		aSaetze: {},
		aEvents: [],
		tEvents: [],
		aTokens: {},
		aTokenFragmente: {},
		zeilenTEvents: [],
		zeilenHeight: 0,
		renderZeilen: [],
		d3eventsize: d3.select('#svg-g-eventsize'),
		d3TokenLastView: -1,
		d3TokenSelected: -1,
		aInfInfo: -1,
		tEventInfo: -1,
		aTokenInfo: {},
		selToken: false,
		message: null,
		mWidth: $('#annotationsvg').width(),
		eEventHeight: 40,
		eInfHeight: 63,
		eInfTop: 25,
		zInfWidth: 100
	},
	mounted: function () {
		this.getMenue();
	},
	computed: {
	},
	methods: {
		reset: function () {
			this.loading = true;
			this.aInfInfo = -1;
			this.tEventInfo = -1;
			this.selToken = false;
			this.aTokenInfo = {};
			this.annotationsTool = {
				aPK: 0,
				nNr: 0,
				loaded: true
			};
			this.aTokenTypes = {};
			this.aInformanten = {};
			this.aInfLen = 0;
			this.aSaetze = {};
			this.aEvents = [];
			this.tEvents = [];
			this.aTokens = {};
			this.aTokenFragmente = {};
			this.zeilenTEvents = [];
			this.zeilenHeight = 0;
			this.renderZeilen = [];
			this.d3eventsize = d3.select('#svg-g-eventsize');
			this.d3TokenLastView = -1;
			this.d3TokenSelected = -1;
			return true;
		},
		/* getTranskript: Läd aktuelle Daten des Transkripts für das Annotations Tool */
		getTranskript: function (aPK, aType = 'start', aNr = 0) {
			console.log('Lade Datensatz ' + aNr + ' von pk: ' + aPK + ' ...');
			if (aType === 'start') {
				$(':focus').blur();
				$('#annotationsvg').focus();
				this.reset();
				this.annotationsTool = {
					aPK: aPK,
					nNr: 0,
					loaded: false
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
						this.aTokenTypes = response.data['aTokenTypes'];
						this.setInformanten(response.data['aInformanten']);
						this.aSaetze = response.data['aSaetze'];
					}
					this.addTokens(response.data['aTokens']);
					this.addEvents(response.data['aEvents']);
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
		/* setInformanten: Informanten setzten */
		setInformanten: function (nInformanten) {
			this.aInformanten = {};
			Object.keys(nInformanten).map(function (key, i) {
				this.aInformanten[key] = nInformanten[key];
				this.aInformanten[key]['i'] = i;
			}, this);
			this.aInfLen = Object.keys(nInformanten).length;
		},
		/* addTokens: Tokens hinzufügen */
		addTokens: function (nTokens) {
			Object.keys(nTokens).map(function (key, i) {
				this.updateToken(key, nTokens[key]);
			}, this);
		},
		/* updateToken */
		updateToken: function (key, values) {
			this.aTokens[key] = values;
			if (this.aTokens[key]['fo']) {
				this.updateTokenFragment(key, this.aTokens[key]['fo']);
			};
			if (this.aEvents[this.aTokens[key]['e']]) {
				this.setRerenderEvent(this.aTokens[key]['e']);
			}
		},
		/* updateTokenFragment */
		updateTokenFragment: function (key, fo) {
			if (this.aTokenFragmente[fo]) {
				if (this.aTokenFragmente[fo].indexOf(key) < 0) {
					this.aTokenFragmente[fo].push(key);
				}
			} else {
				this.aTokenFragmente[fo] = [key];
			}
		},
		/* addEvents: Events hinzufügen */
		addEvents: function (nEvents) {
			nEvents.forEach(function (val) {
				this.updateEvent(0, val);
			}, this);
		},
		/* updateEvent */
		updateEvent: function (index = 0, values) {
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
		},
		/* setRerenderEvent */
		setRerenderEvent: function (key) {
			this.aEvents[key]['rerender'] = true;
			this.debouncedPrerenderEvents();
		},
		debouncedPrerenderEvents: _.debounce(function () {
			var t0 = performance.now();
			this.tEvents.forEach(function (val, key) {
				this.preRenderTEvent(key);
			}, this);
			this.debouncedSVGHeight();
			this.updateZeilenTEvents();
			var t1 = performance.now();
			console.log('debouncedPrerenderEvents: ' + Math.ceil(t1 - t0) + ' ms');
		}, 100),
		debouncedSVGHeight: _.debounce(function () {
			this.scrollRendering();
		}, 50),
		preRenderTEvent: function (key) {
			if (this.tEvents[key]['rerender']) {
				this.tEvents[key]['svgWidth'] = this.sizeTEvent(key, this.d3eventsize);
				this.tEvents[key]['rerender'] = false;
			}
		},
		sizeTEvent: function (key, d3target) {
			var mW = 0;
			var aSTTS = document.getElementById('svg-text-textsize');
			Object.keys(this.aInformanten).map(function (iKey, iI) {	// Informanten durchzählen
				Object.keys(this.tEvents[key]['eId']).map(function (eKey, eI) {
					if (eKey === iKey) {
						var aEvent = this.aEvents[this.tEvents[key]['eId'][eKey]];
						var aTokensIds = aEvent['tid'][iKey];
						var aW = 0;
						var tW = 0;
						var t1W = 0;
						var t2W = 0;
						aTokensIds.forEach(function (aTokenId) {
							aSTTS.textContent = this.getTokenString(aTokenId, 't');
							t1W = aSTTS.getBBox().width;
							aSTTS.textContent = this.getTokenString(aTokenId, 'o', 't');
							t2W = aSTTS.getBBox().width;
							if (t1W > t2W) {
								tW = t1W + 1.5;
							} else {
								tW = t2W + 1.5;
							}
							this.aTokens[aTokenId]['svgLeft'] = aW + 2;
							this.aTokens[aTokenId]['svgWidth'] = tW + 2;
							aW += tW;
						}, this);
						if (aW > mW) {
							mW = aW;
						}
					}
				}, this);
			}, this);
			return mW + 2;
		},
		/* updateZeilenTEvents */
		updateZeilenTEvents: function () {
			var mWidth = $('#annotationsvg').width() - 25;
			var aWidth = this.zInfWidth;
			this.zeilenTEvents = [{'eId': [], 'eH': 0, 'iId': [], 'eT': 0}];
			var aZTEv = 0;
			var eTop = 0;
			this.zeilenHeight = 0;
			this.tEvents.forEach(function (val, key) {
				this.tEvents[key]['svgLeft'] = aWidth - this.zInfWidth;
				aWidth += val['svgWidth'] + 0.5;
				if (aWidth < mWidth) {
					this.zeilenTEvents[aZTEv]['eId'].push(key);
					Object.keys(val['eId']).map(function (iKey, iI) {
						if (this.zeilenTEvents[aZTEv]['iId'].indexOf(iKey) < 0) {
							this.zeilenTEvents[aZTEv]['iId'].push(iKey);
						}
					}, this);
					if ((this.eEventHeight + (this.eInfHeight + this.eInfTop) * this.aInfLen) > this.zeilenTEvents[aZTEv]['eH']) {
						this.zeilenTEvents[aZTEv]['eH'] = (this.eEventHeight + (this.eInfHeight + this.eInfTop) * this.zeilenTEvents[aZTEv]['iId'].length);
					}
				} else {
					this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
					eTop = this.zeilenTEvents[aZTEv]['eT'] + this.zeilenTEvents[aZTEv]['eH'];
					aWidth = this.zInfWidth + val['svgWidth'];
					aZTEv++;
					this.tEvents[key]['svgLeft'] = 0;
					this.zeilenTEvents[aZTEv] = {'eId': [key], 'eH': 0, 'iId': [], 'eT': eTop};
					Object.keys(val['eId']).map(function (iKey, iI) {
						if (this.zeilenTEvents[aZTEv]['iId'].indexOf(iKey) < 0) {
							this.zeilenTEvents[aZTEv]['iId'].push(iKey);
						}
					}, this);
					this.zeilenTEvents[aZTEv]['eH'] = this.eEventHeight + (this.eInfHeight + this.eInfTop) * this.zeilenTEvents[aZTEv]['iId'].length;
				}
			}, this);
			this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
		},
		/* getTokenString */
		getTokenString: function (tId, field, bfield = false) {
			var space = '\u00A0';
			var aTxt = this.getTokenFragment(tId, field, bfield);
			if ((this.aTokens[tId]['tt'] === 2) || (this.aTokens[tId]['fo'] > 0)) {
				space = '';
			}
			if (aTxt[0] === '_') {
				aTxt = aTxt.substr(1);
				space = '';
			};
			// if (aTxt[aTxt.length - 1] === '_') {
			// 	aTxt = aTxt.substr(0, aTxt.length - 1);
			// };
			return space + aTxt;
		},
		/* getTokenFragment */
		getTokenFragment (tId, field, bfield = false) {
			var aTtxt = this.aTokens[tId][field];
			if (bfield && !aTtxt) {
				aTtxt = this.aTokens[tId][bfield];
			}
			if (this.aTokenFragmente[tId] && this.aTokenFragmente[tId].length === 1) {
				this.aTokenFragmente[tId].forEach(function (val) {
					var nTtxt = this.aTokens[val][field];
					if (bfield && !nTtxt) {
						nTtxt = this.aTokens[val][bfield];
					}
					var aPos = aTtxt.lastIndexOf(nTtxt);
					if (aPos > 0) {
						aTtxt = aTtxt.substr(0, aPos);
					}
				}, this);
				return aTtxt;
			}
			return aTtxt;
		},
		/* scrollRendering */
		scrollRendering: function () {
			var sHeight = $('#svgscroller').height();
			var sPos = $('.mcon.vscroller').scrollTop() - 10;
			var sePos = sPos + sHeight + 20;
			var aTop = 0;
			var aBottom = 0;
			var cRenderZeilen = [];
			this.zeilenTEvents.forEach(function (val, key) {
				aBottom = aTop + sHeight;
				if (sePos >= aTop && sPos <= aBottom) {
					cRenderZeilen.push(key);
				}
				this.renderZeilen = cRenderZeilen;
				aTop += val['eH'];
			}, this);
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
		/* Sonsitge Funktionen: */
		objectKeyFilter: function (obj, key) {
			var nObj = {};
			Object.keys(obj).map(function (iKey, iI) {
				if (key.indexOf(iKey) >= 0) {
					nObj[iKey] = obj[iKey];
				}
			}, this);
			return nObj;
		},
		/* Zeit umrechnen */
		durationToSeconds: function (hms) {
			var s = 0.0;
			if (hms && hms.indexOf(':') > -1) {
				var a = hms.split(':');
				if (a.length > 2) { s += parseFloat(a[a.length - 3]) * 60 * 60; }
				if (a.length > 1) { s += parseFloat(a[a.length - 2]) * 60; }
				if (a.length > 0) { s += parseFloat(a[a.length - 1]); }
			} else {
				s = parseFloat(hms);
				if (isNaN(s)) { s = 0.0; }
			}
			return s;
		},
		secondsToDuration: function (sec, fix = 6) {
			var v = '';
			if (sec < 0) { sec = -sec; v = '-'; }
			var h = parseInt(sec / 3600);
			sec %= 3600;
			var m = parseInt(sec / 60);
			var s = sec % 60;
			return v + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s.toFixed(fix)).slice(-(3 + fix));
		}

	}
});

/* Sonstiges */
function searchbypk (nameKey, myArray) {
	for (var i = 0; i < myArray.length; i++) {
		if (myArray[i].pk === nameKey) {
			return i;
		}
	}
}
