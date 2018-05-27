/* global _ $ csrf Vue alert performance confirm */

var preventClose = false;
window.onbeforeunload = function () {
	if (preventClose) {
		return 'Wirklich Tool verlassen?';
	}
};

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
		unsaved: false,
		aTmNr: 1,
		aTranskript: {},
		aEinzelErhebung: {},
		aTokenTypes: {},
		aInformanten: {},
		aInfLen: 0,
		aSaetze: {},
		aEvents: [],
		tEvents: [],
		aTokens: {},
		aTokenReihung: [],
		aTokenReihungInf: {},
		aTokenFragmente: {},
		aTokenSets: {},
		zeilenTEvents: [],
		zeilenHeight: 0,
		renderZeilen: [],
		svgTTS: document.getElementById('svg-text-textsize'),
		d3TokenLastView: -1,
		d3ZeileSelected: -1,
		d3InfSelected: -1,
		d3SelTokenList: [],
		audioPos: 0,
		audioDuration: 0,
		aInfInfo: undefined,
		tEventInfo: undefined,
		aTokenInfo: undefined,
		message: null,
		mWidth: 0,
		sHeight: 0,
		getCharWidthCach: {},
		eEventHeight: 40,
		eInfHeight: 63,
		eInfTop: 25,
		zInfWidth: 100,
		showTransInfo: true,
		showTokenInfo: true,
		showAllgeInfo: false,
		showSuche: false,
		suchen: false,
		suchText: '',
		suchInf: 0,
		suchTokens: [],
		suchTokensInfo: {},
		selToken: -1,
		selTokenBereich: {'v': -1, 'b': -1},
		selTokenListe: [],
		ctrlKS: false
	},
	computed: {
	},
	watch: {
		unsaved: function (nVal, oVal) {
			preventClose = nVal;
		},
		mWidth: function (nVal, oVal) {
			if (nVal !== oVal) {
				this.updateZeilenTEvents();
			}
		},
		selToken: function (nVal, oVal) {
			if (nVal > -1) {
				this.d3ZeileSelected = this.getZeileOfTEvent(this.getTEventOfAEvent(this.searchByKey(this.aTokens[this.selToken]['e'], 'pk', this.aEvents)));
				this.d3InfSelected = this.aTokens[this.selToken]['i'];
				this.scrollToToken(this.selToken);
			} else {
				this.d3ZeileSelected = -1;
				this.d3InfSelected = -1;
			}
		},
		'selTokenBereich.v': function (nVal, oVal) {
			this.checkSelTokenBereich();
		},
		'selTokenBereich.b': function (nVal, oVal) {
			this.checkSelTokenBereich();
		},
		showSuche: function (nVal, oVal) {
			if (nVal) {
				this.$nextTick(() => { this.focusSuchText(); });
			} else {
				this.suchText = '';
				this.focusFocusCatch();
			}
		},
		suchText: function (nVal, oVal) {
			if (nVal.length > 0) {
				this.debouncedSuche();
			} else {
				this.suchTokens = [];
				this.suchTokensInfo = {};
			}
		}
	},
	methods: {
		reset: function () {
			this.unsaved = false;
			this.loading = true;
			this.aInfInfo = undefined;
			this.tEventInfo = undefined;
			this.aTokenInfo = undefined;
			this.annotationsTool = {
				aPK: 0,
				nNr: 0,
				loaded: true
			};
			this.aTranskript = {};
			this.aEinzelErhebung = {};
			this.aTokenTypes = {};
			this.aInformanten = {};
			this.aInfLen = 0;
			this.aSaetze = {};
			this.aEvents = [];
			this.tEvents = [];
			this.aTokens = {};
			this.aTokenReihung = [];
			this.aTokenReihungInf = {};
			this.aTokenFragmente = {};
			this.aTokenSets = {};
			this.zeilenTEvents = [];
			this.zeilenHeight = 0;
			this.renderZeilen = [];
			this.svgTTS = document.getElementById('svg-text-textsize');
			this.d3TokenLastView = -1;
			this.selToken = -1;
			this.selTokenBereich = {'v': -1, 'b': -1};
			this.selTokenListe = [];
			this.audioPos = 0;
			this.audioDuration = 0;
			this.showSuche = false;
			return true;
		},
		/* getTranskript: Läd aktuelle Daten des Transkripts für das Annotations Tool */
		getTranskript: function (aPK, aType = 'start', aNr = 0) {
			if (aType !== 'start' | (!this.unsaved || confirm('Ungespeicherte Daten! Wirklich verwerfen?'))) {
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
							this.aTmNr = response.data['aTmNr'];
							this.aTranskript = response.data['aTranskript'];
							this.aEinzelErhebung = response.data['aEinzelErhebung'];
							this.aTokenTypes = response.data['aTokenTypes'];
							this.setInformanten(response.data['aInformanten']);
							this.aSaetze = response.data['aSaetze'];
							this.focusFocusCatch();
							setTimeout(this.selectNextToken, 200);
						}
						this.addTokens(response.data['aTokens']);
						this.addEvents(response.data['aEvents']);
						this.loading = false;
						if (this.annotationsTool.nNr === response.data['nNr']) {
							this.annotationsTool.nNr = response.data['nNr'];
							this.annotationsTool.loaded = true;
							this.updateATokenSets();
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
			}
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
			if (!this.aTokens[key]['tags']) {
				this.aTokens[key]['tags'] = undefined;
			}
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
				Object.keys(values.tid).map(function (key) {
					values.tid[key].forEach(function (val) {
						this.aTokenReihung.push(val);
						if (!this.aTokenReihungInf[key]) { this.aTokenReihungInf[key] = []; }
						this.aTokenReihungInf[key].push(val);
					}, this);
				}, this);
				index = this.aEvents.push({}) - 1;
				this.aEvents[index] = values;
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
					as: this.durationToSeconds(this.aEvents[index]['s']),
					ae: this.durationToSeconds(this.aEvents[index]['e']),
					al: 0,
					rerender: true,
					eId: {}
				};
				atEvent['al'] = atEvent['ae'] - atEvent['as'];
				Object.keys(this.aEvents[index].tid).map(function (key, i) {
					atEvent['eId'][key] = index;
				}, this);
				var tEvIndex = this.tEvents.push({}) - 1;
				this.tEvents[tEvIndex] = atEvent;
			}
		},
		/* setRerenderEvent */
		setRerenderEvent: function (key) {
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
				this.tEvents[key]['svgWidth'] = this.sizeTEvent(key);
				this.tEvents[key]['rerender'] = false;
			}
		},
		sizeTEvent: function (key) {
			var mW = 0;
			Object.keys(this.aInformanten).map(function (iKey, iI) {	// Informanten durchzählen
				Object.keys(this.tEvents[key]['eId']).map(function (eKey, eI) {
					if (eKey === iKey) {
						var aEvent = this.aEvents[this.tEvents[key]['eId'][eKey]];
						var aTokensIds = aEvent['tid'][iKey];
						var aW = 0;
						aTokensIds.forEach(function (aTokenId) {
							var t1W = this.getTextWidth(this.getTokenString(aTokenId, 't'), false);
							var t2W = this.getTextWidth(this.getTokenString(aTokenId, 'o', 't'), false);
							var tW = ((t1W > t2W) ? t1W : t2W) + 1.5;
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
			var aWidth = this.zInfWidth;
			this.zeilenTEvents = [{'eId': [], 'eH': 0, 'iId': [], 'eT': 0}];
			var aZTEv = 0;
			var eTop = 0;
			this.zeilenHeight = 0;
			this.tEvents.forEach(function (val, key) {
				this.tEvents[key]['svgLeft'] = aWidth - this.zInfWidth;
				aWidth += val['svgWidth'] + 0.5;
				if (aWidth < this.mWidth - 25) {
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
			var sPos = $('.mcon.vscroller').scrollTop();
			var sePos = sPos + this.sHeight + 75;
			var aTop = 0;
			var aBottom = 0;
			var cRenderZeilen = [];
			this.zeilenTEvents.some(function (val, key) {
				aBottom = aTop + val['eH'];
				if (sePos >= aTop && sPos <= aBottom) {
					cRenderZeilen.push(key);
				}
				aTop += val['eH'];
				return aTop > sePos;
			}, this);
			if (this.renderZeilen !== cRenderZeilen) {
				this.renderZeilen = cRenderZeilen;
			}
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
		/* Events */
		/* setAudioPos */
		setAudioPos: function (aPos) {
			this.audioPos = aPos;
		},
		setATokenInfo: function (aVal, aKey) {
			this.aTokenInfo[aKey] = aVal;
		},
		setAudioDuration: function (aPos) {
			this.audioDuration = aPos;
		},
		ctrlKey: function () {
			this.ctrlKS = true;
		},
		/* showTEventInfos */
		showTEventInfos: function (tId) {
			this.tEventInfo = tId;
			setTimeout(function () { $('#tEventInfo').modal('show'); }, 20);
		},
		/* showaInfInfos */
		showaInfInfos: function (iId) {
			this.aInfInfo = iId;
			setTimeout(function () { $('#aInformantenInfo').modal('show'); }, 20);
		},
		/* showaTokenInfos */
		showaTokenInfos: function (eTok, direkt = false, e = undefined) {
			if (direkt || (this.selToken === eTok && (!e || (!e.ctrlKey && !e.shiftKey)))) {
				annotationsTool.aTokens[eTok]['viewed'] = true;
				this.d3TokenLastView = eTok;
				this.aTokenInfo = _.clone(this.aTokens[eTok]);
				this.aTokenInfo['pk'] = eTok;
				this.aTokenInfo['e-txt'] = this.aEvents[this.searchByKey(this.aTokens[eTok]['e'], 'pk', this.aEvents)]['s'];
				setTimeout(function () { $('#aTokenInfo').modal('show'); }, 20);
			} else if (e) {
				if (e.shiftKey) {
					if (this.selTokenBereich.v === -1) {
						this.selTokenBereich.v = this.selToken;
						if (eTok !== this.selToken) {
							this.selTokenBereich.b = eTok;
						}
					} else {
						this.selTokenBereich.b = eTok;
					}
				} else if (e.ctrlKey) {
					if (this.selTokenBereich.v > -1 && this.selTokenBereich.b > -1 && this.selTokenListe.length === 0) {
						(this.d3SelTokenList.slice()).forEach(function (val) {
							this.updateSelTokenListe(val);
						}, this);
					} else if (this.selTokenListe.length === 0) {
						this.updateSelTokenListe(this.selToken);
					}
					this.updateSelTokenListe(eTok);
					this.ctrlKS = true;
					this.selTokenBereich = {'v': -1, 'b': -1};
				} else {
					this.selTokenBereich = {'v': -1, 'b': -1};
					this.selTokenListe = [];
					this.d3SelTokenList = [];
				}
			}
			this.selToken = eTok;
		},
		/* Funktion zur ermittlung der Breite von Buchstaben im SVG-Element */
		getCharWidth: function (zeichen) {
			if (this.getCharWidthCach[zeichen]) {
				return this.getCharWidthCach[zeichen];
			} else {
				if (this.svgTTS) {
					this.svgTTS.textContent = zeichen;
					this.getCharWidthCach[zeichen] = this.svgTTS.getBBox().width;
					if (this.getCharWidthCach[zeichen] === 0) {
						this.svgTTS.textContent = 'X' + zeichen + 'X';
						this.getCharWidthCach[zeichen] = this.svgTTS.getBBox().width - this.getCharWidth('X') * 2;
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
				if (this.svgTTS) {
					this.svgTTS.textContent = text;
					return this.svgTTS.getBBox().width;
				}
			}
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
		searchByKey: function (value, key, list) {
			for (var i = 0; i < list.length; i++) {
				if (list[i][key] === value) {
					return i;
				}
			}
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
		},
		/* Events */
		/* Fenstergröße */
		resizeWindow: function () {
			this.mWidth = $('#annotationsvg').width();
			this.sHeight = $('#svgscroller').height();
		},
		/* Tastatur */
		focusCatchKeyUp: function (e) {
			if (e.keyCode === 39) { // rechts
				e.preventDefault();
				if (e.shiftKey && this.selTokenBereich.v === -1) {
					this.selTokenBereich.v = this.selToken;
				}
				if (e.ctrlKey && !this.ctrlKS) {
					this.updateSelTokenListe(this.selToken);
				}
				this.selectNextToken();
				if (e.shiftKey) {
					this.selTokenBereich.b = this.selToken;
				} else {
					this.selTokenBereich = {'v': -1, 'b': -1};
				}
				if (e.ctrlKey) {
					this.updateSelTokenListe(this.selToken);
					this.ctrlKS = true;
				}
			} else if (e.keyCode === 37) { // links
				e.preventDefault();
				if (e.shiftKey && this.selTokenBereich.v === -1) {
					this.selTokenBereich.v = this.selToken;
				}
				if (e.ctrlKey && !this.ctrlKS) {
					this.updateSelTokenListe(this.selToken);
				}
				this.selectPrevToken();
				if (e.shiftKey) {
					this.selTokenBereich.b = this.selToken;
				} else {
					this.selTokenBereich = {'v': -1, 'b': -1};
				}
				if (e.ctrlKey) {
					this.updateSelTokenListe(this.selToken);
					this.ctrlKS = true;
				}
			} else if (e.keyCode === 40) { // unten
				e.preventDefault();
				this.selTokenBereich = {'v': -1, 'b': -1};
				this.selectNextInf();
			} else if (e.keyCode === 38) { // oben
				e.preventDefault();
				this.selTokenBereich = {'v': -1, 'b': -1};
				this.selectPrevInf();
			} else if (e.keyCode === 13) { // Enter
				e.preventDefault();
				if (this.selToken > -1) {
					this.showaTokenInfos(this.selToken, true);
				}
			} else if (e.keyCode === 17) { // Strg
				if (!this.ctrlKS) {
					this.updateSelTokenListe(this.selToken);
				}
				this.ctrlKS = false;
			} else {
				console.log('focusCatchKeyUp: ' + e.keyCode);
			}
			e.target.value = '';
		},
		focusCatchKeyDown: function (e) {
			if (e.ctrlKey && e.keyCode === 70) { // Strg + F
				e.preventDefault();
				this.focusSuchText();
				this.showSuche = true;
			} else if (e.keyCode === 114) { // F3
				e.preventDefault();
				this.naechsterSuchToken(!e.shiftKey);
			} else if (e.ctrlKey && e.keyCode === 68) { // Strg + D
				e.preventDefault();
				this.ctrlKS = true;
				this.selTokenBereich = {'v': -1, 'b': -1};
				this.selTokenListe = [];
				this.d3SelTokenList = [];
			}
		},
		sucheCatchKeyUp: function (e) {
			if (e.keyCode === 27) { // ESC
				e.preventDefault();
				this.showSuche = false;
			} else if (e.keyCode === 13) { // Enter
				e.preventDefault();
				annotationsTool.focusFocusCatch();
			}
		},
		sucheCatchKeyDown: function (e) {
			if (e.keyCode === 114) { // F3
				e.preventDefault();
				this.naechsterSuchToken(!e.shiftKey);
				annotationsTool.focusFocusCatch();
			}
		},
		focusFocusCatch: function () {
			$('#focuscatch').focus();
		},
		focusSuchText: function () {
			$('#suchtext').focus();
		},
		/* Nächstes Token auswählen */
		selectNextToken: function () {
			this.selToken = this.tokenNextPrev(this.selToken);
		},
		/* Vorherigen Token auswählen */
		selectPrevToken: function () {
			this.selToken = this.tokenNextPrev(this.selToken, false);
		},
		/* Nächsten Informanten/Zeile auswählen */
		selectNextInf: function () {
			this.infNextPrev();
		},
		/* Vorherigen Informanten/Zeile auswählen */
		selectPrevInf: function () {
			this.infNextPrev(false);
		},
		infNextPrev: function (next = true) {
			if (this.tEvents[0]) {
				var aTId = this.selToken;
				if (aTId < 0) {
					this.selToken = this.tokenNextPrev(-1, next);
				} else {
					var aIId = this.aTokens[aTId]['i'];
					var aZAEKey = this.getTEventOfAEvent(this.searchByKey(this.aTokens[aTId]['e'], 'pk', this.aEvents));
					var aZAE = this.tEvents[aZAEKey];
					var aZTE = this.zeilenTEvents[this.getZeileOfTEvent(aZAEKey)];
					var aInfAv = Object.keys(this.objectKeyFilter(this.aInformanten, aZTE['iId']));
					var nTokSel = -1;
					if (String(aInfAv[((next) ? aInfAv.length - 1 : 0)]) !== String(aIId)) {
						var nIId = this.wertNachWert(Object.keys(aZAE['eId']), String(aIId), next);
						if (nIId === undefined) {
							nIId = this.wertNachWert(Object.keys(this.aInformanten), String(aIId), next);
							var aTEvents = this.listeNachWert(aZTE['eId'], aZAEKey, next);
							aTEvents.some(function (tEKey, tI) {
								if (this.tEvents[tEKey]['eId'][nIId]) {
									var tmpAE = this.aEvents[this.tEvents[tEKey]['eId'][nIId]]['tid'][nIId];
									nTokSel = tmpAE[((next) ? 0 : tmpAE.length - 1)];
									return true;
								}
							}, this);
						} else {
							nTokSel = this.aEvents[aZAE['eId'][nIId]]['tid'][nIId][0];
						}
					}
					if (nTokSel < 0) {
						var tmpZTE = this.zeilenTEvents[this.getZeileOfTEvent(aZAEKey) + ((next) ? 1 : -1)];
						if (tmpZTE) {
							var tmpZTEeId = tmpZTE['eId'];
							var tmpTEeId = this.tEvents[tmpZTEeId[((next) ? 0 : tmpZTEeId.length - 1)]]['eId'];
							if (next) {
								var tmpAEtid = this.aEvents[tmpTEeId[Object.keys(tmpTEeId)[0]]]['tid'];
								nTokSel = tmpAEtid[Object.keys(tmpAEtid)[0]][0];
							} else {
								var tmpTEeIdK = Object.keys(tmpTEeId);
								var tmpAEtidR = this.aEvents[tmpTEeId[tmpTEeIdK[tmpTEeIdK.length - 1]]]['tid'];
								var tmpAEtidK = Object.keys(tmpAEtidR);
								var tmpAEtidS = tmpAEtidR[tmpAEtidK[tmpAEtidK.length - 1]];
								nTokSel = tmpAEtidS[tmpAEtidS.length - 1];
							}
						}
					}
					if (nTokSel < 0) {
						nTokSel = this.tokenNextPrev(-1, next);
					}
					this.selToken = nTokSel;
				}
			}
		},
		/* Nächster/Vorheriger Token (next = true next else prev) */
		tokenNextPrev: function (aTId, next = true) {
			var nTId = -1;
			// var aENr = 0;
			if (this.tEvents[0]) {
				if (aTId < 0) {
					/* Erster/Letzer Token */
					return ((next) ? this.aTokenReihung[0] : this.aTokenReihung[this.aTokenReihung.length - 1]);
				} else {
					/* Nächster/Vorheriger Token */
					var aIId = this.aTokens[aTId]['i'];
					var aTRI = this.aTokenReihungInf[aIId];
					var aTRIiO = aTRI.indexOf(aTId);
					return ((next)
												? ((aTRIiO < aTRI.length - 1) ? aTRI[aTRIiO + 1] : this.tokenNextPrev(-1, next))
												: ((aTRIiO > 0) ? aTRI[aTRIiO - 1] : this.tokenNextPrev(-1, next)));
				}
			}
			return nTId;
		},
		/* Zu Token scrollen */
		scrollToToken: function (tId) {
			var sTop = $('.mcon.vscroller').scrollTop();
			var sBottom = sTop + this.sHeight + 75;
			var aZTE = this.zeilenTEvents[this.getZeileOfTEvent(this.getTEventOfAEvent(this.searchByKey(this.aTokens[this.selToken]['e'], 'pk', this.aEvents)))];
			var sTo = 0;
			if (aZTE['eT'] < sTop) {
				sTo = aZTE['eT'] - 20;
				if (sTo < 0) { sTo = 0; }
				$('.mcon.vscroller').stop().animate({scrollTop: sTo}, 250);
			} else if ((aZTE['eT'] + aZTE['eH']) > sBottom) {
				sTo = (aZTE['eT'] + aZTE['eH'] + 20) - (this.sHeight + 75) * 0.8;
				if (sTo < 0) { sTo = 0; }
				$('.mcon.vscroller').stop().animate({scrollTop: sTo}, 250);
			}
		},
		/* Funktionen für Tokenauswahl */
		getTEventOfAEvent: function (aEId) {
			var nKey = -1;
			this.tEvents.some(function (val, key) {
				Object.keys(val['eId']).some(function (xKey, i) {
					if (val['eId'][xKey] === aEId) {
						nKey = key;
						return true;
					}
				}, this);
				return (nKey > -1);
			}, this);
			return nKey;
		},
		getZeileOfTEvent: function (aTEId) {
			var nKey = -1;
			this.zeilenTEvents.some(function (val, key) {
				if (val['eId'].indexOf(aTEId) > -1) {
					nKey = key;
					return true;
				}
			}, this);
			return nKey;
		},
		/* Suchen: */
		suche: function () {
			if (this.showSuche && !this.suchen) {
				this.suchen = true;
				this.suchTokens = [];
				this.suchTokensInfo = {};
				if (this.suchText.length > 1) {	// Suche durchführen
					this.aTokenReihung.forEach(function (key) {
						if (parseInt(this.suchInf) === 0 || this.aTokens[key].i === parseInt(this.suchInf)) {
							var aToken = this.aTokens[key];
							var addToken = false;
							if (aToken.t && aToken.t.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; } else
							if (aToken.o && aToken.o.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; } else
							if (aToken.to && aToken.to.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; }
							if (addToken) {
								this.suchTokens.push(parseInt(key));
								this.suchTokensInfo[parseInt(key)] = {'z': 0};
							}
						}
					}, this);
				}
				if (this.suchTokens.length > 0 && this.suchTokens.indexOf(this.selToken) < 0) {
					this.naechsterSuchToken();
				}
				this.suchen = false;
			}
		},
		naechsterSuchToken: function (next = true) {
			if (this.suchTokens.length > 0) {
				var aList = this.listeNachWertLoop(this.aTokenReihung, this.selToken, next);
				aList.some(function (val, index) {
					if (this.suchTokens.indexOf(val) >= 0) {
						this.selToken = val;
						return true;
					}
				}, this);
			}
		},
		/* Wandelt aktuelle Auswahl in Token Set um */
		selToTokenSet: function () {
			var aTokSetId = -1;
			while (this.aTokenSets[aTokSetId]) {
				aTokSetId -= 1;
			}
			if (this.selTokenBereich.v >= 0 && this.selTokenBereich.b >= 0) {
				this.aTokenSets[aTokSetId] = {'ivt': this.selTokenBereich.v, 'ibt': this.selTokenBereich.b, 'a': this.newAAntworten(), 'ok': false, 'saveme': true};
				this.unsaved = true;
				this.selTokenBereich = {'v': -1, 'b': -1};
				this.d3SelTokenList = [];
			} else if (this.selTokenListe.length > 0) {
				this.aTokenSets[aTokSetId] = {'t': this.selTokenListe.slice(), 'a': this.newAAntworten(), 'ok': false, 'saveme': true};
				this.unsaved = true;
				this.selTokenListe = [];
				this.d3SelTokenList = [];
			}
			this.updateATokenSets();
			this.focusFocusCatch();
		},
		/* Leere Antwort erstellen und negativen Index zurückgeben */
		newAAntworten: function () {
			/* ToDo !! */
			return -1;
		},
		updateATokenSets: function () {
			Object.keys(this.aTokenSets).map(function (aTokSetId, iI) {
				if (!this.aTokenSets[aTokSetId].ok) {
					if (this.aTokenSets[aTokSetId].ivt) {
						var aInf = this.aTokens[this.aTokenSets[aTokSetId].ivt].i;
						if (this.aTokenReihungInf[aInf].indexOf(this.aTokenSets[aTokSetId].ivt >= 0 && this.aTokenReihungInf[aInf].indexOf(this.aTokenSets[aTokSetId].ibt >= 0))) {
							if (this.aTokenSets[aTokSetId].ivt > this.aTokenSets[aTokSetId].ibt) {
								var temp = this.aTokenSets[aTokSetId].ivt;
								this.aTokenSets[aTokSetId].ivt = this.aTokenSets[aTokSetId].ibt;
								this.aTokenSets[aTokSetId].ibt = temp;
							}
							var aList = _.clone(this.aTokenReihungInf[aInf]);
							this.aTokenSets[aTokSetId].tx = aList.splice(aList.indexOf(this.aTokenSets[aTokSetId].ivt), aList.indexOf(this.aTokenSets[aTokSetId].ibt) + 1 - aList.indexOf(this.aTokenSets[aTokSetId].ivt));
							this.aTokenSets[aTokSetId].ok = true;
						}
					} else if (this.aTokenSets[aTokSetId].t && this.listeWerteInListe(this.aTokenSets[aTokSetId].t, this.aTokenReihung)) {
						this.aTokenSets[aTokSetId].t = this.sortEventIdListe(this.aTokenSets[aTokSetId].t);
						this.aTokenSets[aTokSetId].ok = true;
					}
				}
			}, this);
		},
		checkSelTokenBereich: function () {
			if (this.selTokenBereich.v >= 0 && this.selTokenBereich.b >= 0) {
				var aInf = this.aTokens[this.selTokenBereich.v].i;
				if ((aInf !== this.aTokens[this.selTokenBereich.b].i) || this.selTokenBereich.v === this.selTokenBereich.b) {
					this.selTokenBereich = {'v': -1, 'b': -1};
					this.d3SelTokenList = [];
					return true;
				}
				this.selTokenListe = [];
				var aList = _.clone(this.aTokenReihungInf[aInf]);
				var sTBv = this.selTokenBereich.v;
				var sTBb = this.selTokenBereich.b;
				if (sTBv > sTBb) { var temp = sTBv; sTBv = sTBb; sTBb = temp; }
				this.d3SelTokenList = aList.splice(aList.indexOf(sTBv), aList.indexOf(sTBb) + 1 - aList.indexOf(sTBv));
			} else {
				if (this.selTokenListe.length < 1) {
					this.d3SelTokenList = [];
				}
			}
		},
		updateSelTokenListe: function (eTok = undefined) {
			if (eTok !== undefined) {
				this.selTokenBereich = {'v': -1, 'b': -1};
				if (this.selTokenListe.indexOf(eTok) > -1) {
					this.selTokenListe.splice(this.selTokenListe.indexOf(eTok), 1);
				} else {
					if (this.selTokenListe.length < 1 || this.aTokens[eTok].i === this.aTokens[this.selTokenListe[0]].i) {
						this.selTokenListe.push(eTok);
					} else {
						this.selTokenListe = [];
					}
				}
			}
			this.d3SelTokenList = this.selTokenListe;
		},
		sucheZuAuswahlListe: function () {
			this.suchTokens.forEach(function (val) {
				if (this.selTokenListe.indexOf(val) < 0) {
					this.updateSelTokenListe(val);
				}
			}, this);
			this.focusFocusCatch();
		},
		listeNachWert: function (liste, val, next = true) {
			var aList = ((next) ? liste.slice() : liste.slice().reverse());
			if (aList.indexOf(val) < aList.length - 1) {
				aList.splice(0, aList.indexOf(val) + 1);
				return aList;
			}
			return [];
		},
		wertNachWert: function (list, val, next = true) {
			var aList = ((next) ? list : list.slice().reverse());
			if (aList.indexOf(val) < aList.length - 1) {
				return aList[aList.indexOf(val) + 1];
			}
			return undefined;
		},
		listeNachWertLoop: function (liste, val, next = true) {
			var aList = ((next) ? liste.slice() : liste.slice().reverse());
			if (val && aList.indexOf(val) > -1 && aList.indexOf(val) < aList.length - 1) {
				if (aList.indexOf(val) > 0) {
					aList = aList.concat(aList.splice(0, aList.indexOf(val) + 1));
				} else {
					aList.splice(0, 1);
				}
			}
			return aList;
		},
		/* Sortiert und Filtert vorgegebene Liste mit Event IDs chronologisch nach aTokenReihung. */
		sortEventIdListe: function (aEListe) {
			var nEListe = [];
			this.aTokenReihung.forEach(function (val) {
				if (aEListe.indexOf(val) >= 0) {
					nEListe.push(val);
				}
			}, this);
			return nEListe;
		},
		listeWerteInListe: function (aListe, bListe) {
			var cListe = aListe.slice();
			bListe.some(function (val) {
				var ap = cListe.indexOf(val);
				if (ap >= 0) {
					cListe.splice(ap, 1);
					return (cListe.length === 0);
				}
			}, this);
			return (cListe.length === 0);
		},
		tokenCountByInf: function (aTRI) {
			var output = '';
			Object.keys(this.aInformanten).map(function (iKey, iI) {
				output += this.aInformanten[iKey].k + ': ' + ((aTRI[iKey]) ? aTRI[iKey].length.toLocaleString() : '0') + '\n';
			}, this);
			return output;
		}
	},
	mounted: function () {
		document.getElementById('svgscroller').addEventListener('scroll', this.scrollRendering);
		window.addEventListener('resize', this.resizeWindow);
		this.resizeWindow();
		this.getMenue();
		/* Wenn Modal angezeigt wird */
		$(document).on('shown.bs.modal', '#aTokenInfo', function (e) {
			$('#aTokenText').focus();
		});
		/* Wenn Modal ausgeblendet wurde */
		$(document).on('hidden.bs.modal', '.modal', function (e) {
			if ($(this).data('unset')) {
				annotationsTool[$(this).data('unset')] = undefined;
			}
			annotationsTool.focusFocusCatch();
		});
	},
	created: function () {
		this.debouncedSuche = _.debounce(this.suche, 500);
	},
	beforeDestroy: function () {
		document.getElementById('svgscroller').removeEventListener('scroll', this.scrollRendering);
		window.removeEventListener('resize', this.resizeWindow);
	}
});
