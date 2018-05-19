/* global _ $ csrf Vue alert performance */

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
		aTokenFragmente: {},
		zeilenTEvents: [],
		zeilenHeight: 0,
		renderZeilen: [],
		renderZeilenOld: [],
		svgTTS: document.getElementById('svg-text-textsize'),
		d3TokenLastView: -1,
		d3TokenSelected: -1,
		d3ZeileSelected: -1,
		d3InfSelected: -1,
		audioPos: 0,
		audioDuration: 0,
		aInfInfo: undefined,
		tEventInfo: undefined,
		aTokenInfo: undefined,
		selToken: false,
		message: null,
		mWidth: $('#annotationsvg').width(),
		getCharWidthCach: {},
		eEventHeight: 40,
		eInfHeight: 63,
		eInfTop: 25,
		zInfWidth: 100,
		showTransInfo: true,
		showTokenInfo: true,
		showSuche: false,
		suchen: false,
		suchText: '',
		suchTokens: []
	},
	computed: {
	},
	watch: {
		d3TokenSelected: function (nVal, oVal) {
			if (nVal > -1) {
				this.d3ZeileSelected = this.getZeileOfTEvent(this.getTEventOfAEvent(this.searchbypk(this.aTokens[this.d3TokenSelected]['e'], this.aEvents)));
				this.d3InfSelected = this.aTokens[this.d3TokenSelected]['i'];
				this.scrollToToken(this.d3TokenSelected);
			} else {
				this.d3ZeileSelected = -1;
				this.d3InfSelected = -1;
			}
		},
		showSuche: function (nVal, oVal) {
			if (nVal) {
				this.$nextTick(() => { $('#suchtext').focus(); });
			} else {
				this.suchText = '';
				this.suchTokens = [];
				this.focusFocusCatch();
			}
		},
		suchText: function (nVal, oVal) {
			this.debouncedSuche();
		}
	},
	methods: {
		reset: function () {
			this.loading = true;
			this.aInfInfo = undefined;
			this.tEventInfo = undefined;
			this.selToken = false;
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
			this.aTokenFragmente = {};
			this.zeilenTEvents = [];
			this.zeilenHeight = 0;
			this.renderZeilen = [];
			this.svgTTS = document.getElementById('svg-text-textsize');
			this.d3TokenLastView = -1;
			this.d3TokenSelected = -1;
			this.audioPos = 0;
			this.audioDuration = 0;
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
						var tW = 0;
						var t1W = 0;
						var t2W = 0;
						aTokensIds.forEach(function (aTokenId) {
							t1W = this.getTextWidth(this.getTokenString(aTokenId, 't'), false);
							t2W = this.getTextWidth(this.getTokenString(aTokenId, 'o', 't'), false);
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
			// var t0 = performance.now();
			var sHeight = $('#svgscroller').height() + 75;
			var sPos = $('.mcon.vscroller').scrollTop();
			var sePos = sPos + sHeight;
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
			// this.renderZeilen = [];
			if (this.renderZeilenOld !== cRenderZeilen) {
				this.renderZeilen = cRenderZeilen;
				this.renderZeilenOld = this.renderZeilen;
			}
			// var t1 = performance.now();
			// console.log('scrollRendering: ' + Math.ceil(t1 - t0) + ' ms');
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
		showaTokenInfos: function (eTok, direkt = false) {
			annotationsTool.aTokens[eTok]['viewed'] = true;
			if (direkt || this.d3TokenSelected === eTok) {
				this.d3TokenLastView = eTok;
				this.aTokenInfo = _.clone(this.aTokens[eTok]);
				this.aTokenInfo['pk'] = eTok;
				this.aTokenInfo['e-txt'] = this.aEvents[this.searchbypk(this.aTokens[eTok]['e'], this.aEvents)]['s'];
				setTimeout(function () { $('#aTokenInfo').modal('show'); }, 20);
			}
			this.d3TokenSelected = eTok;
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
		searchbypk: function (nameKey, myArray) {
			for (var i = 0; i < myArray.length; i++) {
				if (myArray[i].pk === nameKey) {
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
		/* Tastatur */
		focusCatchKeyUp: function (e) {
			if (e.keyCode === 39) { // rechts
				e.preventDefault();
				this.selectNextToken();
			} else if (e.keyCode === 37) { // links
				e.preventDefault();
				this.selectPrevToken();
			} else if (e.keyCode === 40) { // unten
				e.preventDefault();
				this.selectNextInf();
			} else if (e.keyCode === 38) { // oben
				e.preventDefault();
				this.selectPrevInf();
			} else if (e.keyCode === 13) { // Enter
				e.preventDefault();
				if (this.d3TokenSelected > -1) {
					this.showaTokenInfos(this.d3TokenSelected, true);
				}
			} else {
				console.log('focusCatchKeyUp: ' + e.keyCode);
			}
			e.target.value = '';
		},
		focusCatchKeyDown: function (e) {
			if (e.ctrlKey && e.keyCode === 70) { // Strg + F
				e.preventDefault();
				this.showSuche = true;
			}
		},
		sucheCatchKeyUp: function (e) {
			if (e.keyCode === 27) {
				this.showSuche = false;
				e.preventDefault();
			}
		},
		focusFocusCatch: function () {
			$('#focuscatch').focus();
		},
		/* Nächstes Token auswählen */
		selectNextToken: function () {
			this.d3TokenSelected = this.tokenNextPrev(this.d3TokenSelected);
		},
		/* Vorherigen Token auswählen */
		selectPrevToken: function () {
			this.d3TokenSelected = this.tokenNextPrev(this.d3TokenSelected, false);
		},
		/* Nächsten Informanten/Zeile auswählen */
		selectNextInf: function () {
			if (this.tEvents[0]) {
				var aTId = this.d3TokenSelected;
				if (aTId < 0) {
					this.d3TokenSelected = this.tokenNextPrev(-1);
				} else {
					var aIId = this.aTokens[aTId]['i'];
					var aZAEKey = this.getTEventOfAEvent(this.searchbypk(this.aTokens[aTId]['e'], this.aEvents));
					var aZAE = this.tEvents[aZAEKey];
					var aZTE = this.zeilenTEvents[this.getZeileOfTEvent(aZAEKey)];
					var aInfAv = Object.keys(this.objectKeyFilter(this.aInformanten, aZTE['iId']));
					var nTokSel = -1;
					if (String(aInfAv[aInfAv.length - 1]) !== String(aIId)) {
						var nIId = this.getNextPrevValueOfValue(Object.keys(aZAE['eId']), String(aIId));
						if (nIId === false) {
							nIId = this.getNextPrevValueOfValue(Object.keys(this.aInformanten), String(aIId));
							var aTEvents = this.getNextPrevValuesOfValue(aZTE['eId'], aZAEKey);
							aTEvents.some(function (tEKey, tI) {
								if (this.tEvents[tEKey]['eId'][nIId]) {
									nTokSel = this.aEvents[this.tEvents[tEKey]['eId'][nIId]]['tid'][nIId][0];
									return true;
								}
							}, this);
						} else {
							nTokSel = this.aEvents[aZAE['eId'][nIId]]['tid'][nIId][0];
						};
					}
					if (nTokSel < 0) {
						var tmpZTE = this.zeilenTEvents[this.getZeileOfTEvent(aZAEKey) + 1];
						if (tmpZTE) {
							var tmpZTEeId = tmpZTE['eId'];
							var tmpTEeId = this.tEvents[tmpZTEeId[0]]['eId'];
							var tmpAEtid = this.aEvents[tmpTEeId[Object.keys(tmpTEeId)[0]]]['tid'];
							nTokSel = tmpAEtid[Object.keys(tmpAEtid)[0]][0];
						}
					}
					if (nTokSel < 0) {
						nTokSel = this.tokenNextPrev(-1, false);
					}
					this.d3TokenSelected = nTokSel;
				}
			}
		},
		/* Vorherigen Informanten/Zeile auswählen */
		selectPrevInf: function () {
			if (this.tEvents[0]) {
				var aTId = this.d3TokenSelected;
				if (aTId < 0) {
					this.d3TokenSelected = this.tokenNextPrev(-1, false);
				} else {
					var aIId = this.aTokens[aTId]['i'];
					var aZAEKey = this.getTEventOfAEvent(this.searchbypk(this.aTokens[aTId]['e'], this.aEvents));
					var aZAE = this.tEvents[aZAEKey];
					var aZTE = this.zeilenTEvents[this.getZeileOfTEvent(aZAEKey)];
					var aInfAv = Object.keys(this.objectKeyFilter(this.aInformanten, aZTE['iId']));
					var nTokSel = -1;
					if (String(aInfAv[0]) !== String(aIId)) {
						var nIId = this.getNextPrevValueOfValue(Object.keys(aZAE['eId']), String(aIId), false);
						if (nIId === false) {
							nIId = this.getNextPrevValueOfValue(Object.keys(this.aInformanten), String(aIId), false);
							var aTEvents = this.getNextPrevValuesOfValue(aZTE['eId'], aZAEKey, false);
							aTEvents.some(function (tEKey, tI) {
								if (this.tEvents[tEKey]['eId'][nIId]) {
									var tmpAE = this.aEvents[this.tEvents[tEKey]['eId'][nIId]]['tid'][nIId];
									nTokSel = tmpAE[tmpAE.length - 1];
									return true;
								}
							}, this);
						} else {
							var tmpAE = this.aEvents[aZAE['eId'][nIId]]['tid'][nIId];
							nTokSel = tmpAE[0];
						};
					}
					if (nTokSel < 0) {
						var tmpZTE = this.zeilenTEvents[this.getZeileOfTEvent(aZAEKey) - 1];
						if (tmpZTE) {
							var tmpZTEeId = tmpZTE['eId'];
							var tmpTEeId = this.tEvents[tmpZTEeId[tmpZTEeId.length - 1]]['eId'];
							var tmpTEeIdK = Object.keys(tmpTEeId);
							var tmpAEtid = this.aEvents[tmpTEeId[tmpTEeIdK[tmpTEeIdK.length - 1]]]['tid'];
							var tmpAEtidK = Object.keys(tmpAEtid);
							var tmpAEtidS = tmpAEtid[tmpAEtidK[tmpAEtidK.length - 1]];
							nTokSel = tmpAEtidS[tmpAEtidS.length - 1];
						}
					}
					if (nTokSel < 0) {
						nTokSel = this.tokenNextPrev(-1);
					}
					this.d3TokenSelected = nTokSel;
				}
			}
		},
		getNextPrevValuesOfValue: function (list, val, next = true) {
			var nEvG = false;
			var nVal = [];
			var xList = ((next) ? list : list.slice().reverse());
			xList.some(function (v, i) {
				if (nEvG) {
					nVal.push(v);
				}
				if (v === val) {
					nEvG = true;
				}
			}, this);
			return nVal;
		},
		getNextPrevValueOfValue: function (list, val, next = true) {
			var nEvG = false;
			var nVal = false;
			var xList = ((next) ? list : list.slice().reverse());
			xList.some(function (v, i) {
				if (v === val) {
					nEvG = true;
				} else if (nEvG) {
					nVal = v;
					return true;
				}
			}, this);
			return nVal;
		},
		/* Nächster/Vorheriger Token (next = true next else prev) */
		tokenNextPrev: function (aTId, next = true) {
			var nTId = -1;
			var aENr = 0;
			if (this.tEvents[0]) {
				if (aTId < 0) {
					/* Erster/Letzer Token */
					if (next) {
						aENr = this.tEvents[0].eId[Object.keys(this.tEvents[0].eId)[0]];
						nTId = this.aEvents[aENr]['tid'][Object.keys(this.aEvents[aENr]['tid'])[0]][0];
					} else {
						var atEM = this.tEvents.length - 1;
						var eIdKeys = Object.keys(this.tEvents[atEM].eId);
						aENr = this.tEvents[atEM].eId[eIdKeys[eIdKeys.length - 1]];
						var tidKeys = Object.keys(this.aEvents[aENr]['tid']);
						var aTSL = this.aEvents[aENr]['tid'][tidKeys[tidKeys.length - 1]];
						nTId = aTSL[aTSL.length - 1];
					}
				} else {
					/* Nächster/Vorheriger Token */
					aENr = this.searchbypk(this.aTokens[aTId]['e'], this.aEvents);
					var aIId = this.aTokens[aTId]['i'];
					if (this.aEvents[aENr]['tid'][aIId]) {
						this.aEvents[aENr]['tid'][aIId].forEach(function (val, key) {
							if (val === aTId) {
								var tSelTok = this.aEvents[aENr]['tid'][aIId][key + ((next) ? 1 : -1)];
								if (tSelTok) {
									nTId = tSelTok;
								}
							}
						}, this);
					}
					/* Nächsten/Vorherigen Token im nächsten/vorherigen Event suchen */
					if (nTId < 0) {
						var tEventsData = ((next) ? this.tEvents : this.tEvents.slice().reverse());
						var nEvG = false;
						tEventsData.some(function (val, key) {
							if (val['eId'][aIId] === aENr) {
								nEvG = true;
							} else if (nEvG) {
								if (val['eId'][aIId] >= 0) {
									var aEtid = this.aEvents[val['eId'][aIId]]['tid'][aIId];
									nTId = ((next) ? aEtid[0] : aEtid[aEtid.length - 1]);
									return true;
								}
							}
						}, this);
					}
					if (nTId < 0) {
						nTId = this.tokenNextPrev(-1, next);
					}
				}
			}
			return nTId;
		},
		/* Zu Token scrollen */
		scrollToToken: function (tId) {
			var sHeight = $('#svgscroller').height() + 75;
			var sTop = $('.mcon.vscroller').scrollTop();
			var sBottom = sTop + sHeight;
			var aZTE = this.zeilenTEvents[this.getZeileOfTEvent(this.getTEventOfAEvent(this.searchbypk(this.aTokens[this.d3TokenSelected]['e'], this.aEvents)))];
			var sTo = 0;
			if (aZTE['eT'] < sTop) {
				sTo = aZTE['eT'] - 20;
				if (sTo < 0) { sTo = 0; }
				$('.mcon.vscroller').stop().animate({scrollTop: sTo}, 250);
			} else if ((aZTE['eT'] + aZTE['eH']) > sBottom) {
				sTo = (aZTE['eT'] + aZTE['eH'] + 20) - sHeight * 0.8;
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
				if (this.suchText.length > 1) {	// Suche durchführen
					Object.keys(this.aTokens).map(function (key, i) {
						var aToken = this.aTokens[key];
						var addToken = false;
						if (aToken.t && aToken.t.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; } else
						if (aToken.o && aToken.o.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; } else
						if (aToken.to && aToken.to.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; }
						if (addToken) {
							this.suchTokens.push({'id': key});
						}
					}, this);
				}
				this.suchen = false;
			}
		}
	},
	mounted: function () {
		document.getElementById('svgscroller').addEventListener('scroll', this.scrollRendering);
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
	}
});
