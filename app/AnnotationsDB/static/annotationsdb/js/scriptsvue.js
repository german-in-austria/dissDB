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
		delTokenSets: {},
		aAntworten: {},
		delAntworten: {},
		zeilenTEvents: [],
		zeilenHeight: 0,
		renderZeilen: [],
		svgTTS: document.getElementById('svg-text-textsize'),
		svgTokenLastView: -1,
		svgZeileSelected: -1,
		svgInfSelected: -1,
		svgSelTokenList: [],
		audioPos: 0,
		audioDuration: 0,
		aInfInfo: undefined,
		tEventInfo: undefined,
		aTokenInfo: undefined,
		aTokenSetInfo: undefined,
		message: null,
		mWidth: 0,
		sHeight: 0,
		getCharWidthCach: {},
		aTokenSetHeight: 20,
		eEventHeight: 40,
		eInfHeight: 63,
		eInfTop: 10,
		zInfWidth: 100,
		showTransInfo: true,
		showTokenInfo: true,
		showTokenSetInfo: true,
		showTokenSetInfos: true,
		showAllgeInfo: false,
		showSuche: false,
		showFilter: false,
		suchen: false,
		suchText: '',
		suchInf: 0,
		suchTokens: [],
		suchTokensInfo: {},
		selToken: -1,
		selTokenBereich: {'v': -1, 'b': -1},
		selTokenListe: [],
		ctrlKS: false,
		selTokenSet: 0,
		selTokenSetSTMax: 15
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
				this.svgZeileSelected = this.getZeileOfTEvent(this.getTEventOfAEvent(this.searchByKey(this.aTokens[this.selToken]['e'], 'pk', this.aEvents)));
				this.svgInfSelected = this.aTokens[this.selToken]['i'];
				this.scrollToToken(this.selToken);
			} else {
				this.svgZeileSelected = -1;
				this.svgInfSelected = -1;
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
		showFilter: function (nVal, oVal) {
			if (!nVal) {
				Object.keys(this.aInformanten).map(function (iKey, iI) {
					this.aInformanten[iKey].show = true;
				}, this);
				this.debouncedUpdateInfShow();
			}
		},
		suchText: function (nVal, oVal) {
			if (nVal.length > 0) {
				this.debouncedSuche();
			} else {
				this.suchTokens = [];
				this.suchTokensInfo = {};
			}
		},
		aTokenInfo: function (nVal, oVal) { this.aTokenInfoChange(nVal, oVal); },
		'aTokenInfo.t': function (nVal, oVal) { this.aTokenInfoChange(nVal, oVal); },
		'aTokenInfo.tt': function (nVal, oVal) { this.aTokenInfoChange(nVal, oVal); },
		'aTokenInfo.o': function (nVal, oVal) { this.aTokenInfoChange(nVal, oVal); },
		'aTokenInfo.le': function (nVal, oVal) { this.aTokenInfoChange(nVal, oVal); },
		'aTokenInfo.to': function (nVal, oVal) { this.aTokenInfoChange(nVal, oVal); },
		'aTokenInfo.changed': function (nVal, oVal) {
			this.modalSperren('#aTokenInfo');
		},
		aTokenSetInfo: function (nVal, oVal) {
			if (this.aTokenSetInfo && oVal) { this.$set(this.aTokenSetInfo, 'changed', true); };
		},
		'aTokenSetInfo.changed': function (nVal, oVal) {
			this.modalSperren('#aTokenSetInfo');
		}
	},
	methods: {
		reset: function () {
			this.unsaved = false;
			this.loading = true;
			this.aInfInfo = undefined;
			this.tEventInfo = undefined;
			this.aTokenInfo = undefined;
			this.aTokenSetInfo = undefined;
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
			this.aAntworten = {};
			this.zeilenTEvents = [];
			this.zeilenHeight = 0;
			this.renderZeilen = [];
			this.svgTTS = document.getElementById('svg-text-textsize');
			this.svgTokenLastView = -1;
			this.selToken = -1;
			this.selTokenSet = 0;
			this.selTokenBereich = {'v': -1, 'b': -1};
			this.selTokenListe = [];
			this.audioPos = 0;
			this.audioDuration = 0;
			this.showSuche = false;
			this.showFilter = false;
			return true;
		},
		/* getTranskript: Läd aktuelle Daten des Transkripts für das Annotations Tool */
		getTranskript: function (aPK, aType = 'start', aNr = 0) {
			if (aType !== 'start' || (!this.unsaved || confirm('Ungespeicherte Daten! Wirklich verwerfen?'))) {
				console.log('Lade Datensatz ' + aNr + '/' + this.aTmNr + ' von Transkript pk: ' + aPK + ' ...');
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
						this.addTokenSets(response.data['aTokenSets']);
						this.addAntworten(response.data['aAntworten']);
						this.loading = false;
						if (this.annotationsTool.nNr === response.data['nNr']) {
							this.$set(this.annotationsTool, 'nNr', response.data['nNr']);
							this.annotationsTool.loaded = true;
							console.log('Alle Datensätze geladen.');
						} else if (this.annotationsTool.loaded === false) {
							this.$set(this.annotationsTool, 'nNr', response.data['nNr']);
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
		/* Änderungen speichern */
		speichern: function () {
			console.log('Änderungen speichern');
			var sOK = true;
			var sData = {};
			/* Token für speichern auslesen */
			var sATokens = {};
			Object.keys(this.aTokens).map(function (key, i) {
				if (this.aTokens[key].saveme) {
					sATokens[key] = this.filterProperties(this.aTokens[key], ['a', 't', 'tt', 'tr', 'e', 'to', 'i', 'o', 's', 'sr', 'fo', 'le']);
				}
			}, this);
			if (Object.keys(sATokens).length > 0) {
				sData.aTokens = sATokens;
			}
			/* Token Sets für speichern auslesen */
			var sATokenSets = {};
			Object.keys(this.aTokenSets).map(function (key, i) {
				if (this.aTokenSets[key].saveme) {
					sATokenSets[key] = this.filterProperties(this.aTokenSets[key], ['a', 'ivt', 'ibt', 't']);
				}
			}, this);
			if (Object.keys(sATokenSets).length > 0) {
				sData.aTokenSets = sATokenSets;
			}
			if (Object.keys(this.delTokenSets).length > 0) {
				sData.dTokenSets = this.delTokenSets;
			}
			/* Antworten für speichern auslesen */
			var sAAntworten = {};
			Object.keys(this.aAntworten).map(function (key, i) {
				if (this.aAntworten[key].saveme) {
					sAAntworten[key] = this.filterProperties(this.aAntworten[key], ['vi', 'inat', 'is', 'ibfl', 'it', 'its', 'bds', 'sa', 'ea', 'k']);
					if (this.aAntworten[key].tags) {
						sAAntworten[key].tags = this.getFlatTags(this.aAntworten[key].tags);
					}
				}
			}, this);
			if (Object.keys(sAAntworten).length > 0) {
				sData.aAntworten = sAAntworten;
			}
			if (Object.keys(this.delAntworten).length > 0) {
				sData.dAntworten = this.delAntworten;
			}
			console.log(sData);
			if (sOK) {
				this.loading = true;
				this.$http.post('',
					{
						speichern: JSON.stringify(sData)
					})
				.then((response) => {
					if (response.data['OK']) {
						console.log(response.data);
						if (response.data['gespeichert']) {
							/* Tokens */
							if (response.data['gespeichert']['aTokens']) {
								Object.keys(response.data['gespeichert']['aTokens']).map(function (key, i) {
									var nToken = response.data['gespeichert']['aTokens'][key];
									if (this.aTokens[key]) {
										delete this.aTokens[key];
									}
									var aKey = ((nToken.nId) ? nToken.nId : key);
									if (nToken.nId) { delete nToken.nId; };
									this.updateToken(aKey, nToken);
									this.preRenderTEvent(this.getTEventOfAEvent(this.searchByKey(nToken.e, 'pk', this.aEvents)), true);
								}, this);
							}
							/* Token Sets */
							if (response.data['gespeichert']['aTokenSets']) {
								Object.keys(response.data['gespeichert']['aTokenSets']).map(function (key, i) {
									var nTokenSet = response.data['gespeichert']['aTokenSets'][key];
									if (this.aTokenSets[key]) {
										delete this.aTokenSets[key];
									}
									var aKey = ((nTokenSet.nId) ? nTokenSet.nId : key);
									this.aTokenSets[aKey] = {};
									this.aTokenSets[aKey].a = nTokenSet.a;
									if (nTokenSet.ivt) { this.aTokenSets[aKey].ivt = nTokenSet.ivt; };
									if (nTokenSet.ibt) { this.aTokenSets[aKey].ibt = nTokenSet.ibt; };
									if (nTokenSet.t) { this.aTokenSets[aKey].t = nTokenSet.t; };
								}, this);
							}
							if (response.data['gespeichert']['dTokenSets']) {
								Object.keys(response.data['gespeichert']['dTokenSets']).map(function (key, i) {
									if (this.aTokenSets[key]) {
										delete this.aTokenSets[key];
									}
									if (this.delTokenSets[key]) {
										delete this.delTokenSets[key];
									}
								}, this);
							}
							/* Antworten */
							if (response.data['gespeichert']['aAntworten']) {
								Object.keys(response.data['gespeichert']['aAntworten']).map(function (key, i) {
									var nAntwort = response.data['gespeichert']['aAntworten'][key];
									if (this.aAntworten[key]) {
										if (this.aAntworten[key]['its'] && this.aTokenSets[this.aAntworten[key]['its']]) {
											delete this.aTokenSets[this.aAntworten[key]['its']].aId;
										}
										if (this.aAntworten[key]['it'] && this.aTokens[this.aAntworten[key]['it']]) {
											delete this.aTokens[this.aAntworten[key]['it']].aId;
										}
										delete this.aAntworten[key];
									}
									var aKey = ((nAntwort.nId) ? nAntwort.nId : key);
									if (nAntwort.nId) {
										delete nAntwort.nId;
									}
									if (nAntwort.pt) {
										nAntwort.tags = [];
										nAntwort.pt.forEach(function (val) {
											nAntwort.tags.push({'e': val.e, 'tags': this.processTags(val.t).tags});
										}, this);
										delete nAntwort.pt;
									}
									this.setAAntwort(aKey, nAntwort);
								}, this);
							}
							if (response.data['gespeichert']['dAntworten']) {
								Object.keys(response.data['gespeichert']['dAntworten']).map(function (key, i) {
									if (this.aAntworten[key]) {
										delete this.aAntworten[key];
									}
									if (this.delAntworten[key]) {
										delete this.delAntworten[key];
									}
								}, this);
							}
							this.updateATokenSets();
							this.updateZeilenTEvents();
							this.focusFocusCatch();
							this.unsaved = false;
						}
					} else {
						alert('Fehler!');
						console.log(response);
					}
					this.loading = false;
				})
				.catch((err) => {
					console.log(err);
					alert('Fehler!');
					this.loading = false;
				});
			}
		},
		getFlatTags: function (aTags) {
			var fTags = [];
			aTags.forEach(function (val) {
				fTags.push({'e': val.e, 't': this.getFlatTagsX(val.tags)});
			}, this);
			return fTags;
		},
		getFlatTagsX: function (aTags) {
			var fTags = [];
			aTags.forEach(function (val) {
				var aTag = {'i': val.id, 't': val.tag};
				fTags.push(aTag);
				if (val.tags) {
					this.getFlatTagsX(val.tags).forEach(function (sval) {
						fTags.push(sval);
					}, this);
				}
			}, this);
			return fTags;
		},
		/* setInformanten: Informanten setzten */
		setInformanten: function (nInformanten) {
			this.aInformanten = {};
			Object.keys(nInformanten).map(function (key, i) {
				this.aInformanten[key] = nInformanten[key];
				this.aInformanten[key]['i'] = i;
				this.aInformanten[key]['show'] = true;
			}, this);
			this.aInfLen = Object.keys(nInformanten).length;
		},
		/* addTokens: Tokens hinzufügen */
		addTokens: function (nTokens) {
			Object.keys(nTokens).map(function (key, i) {
				this.updateToken(key, nTokens[key]);
			}, this);
		},
		/* addTokenSets: TokenSets hinzufügen */
		addTokenSets: function (nTokenSets) {
			Object.keys(nTokenSets).map(function (key, i) {
				this.aTokenSets[key] = nTokenSets[key];
			}, this);
			this.debouncedUpdateATokenSets();
		},
		/* addAntworten: Antworten hinzufügen */
		addAntworten: function (nAntworten) {
			Object.keys(nAntworten).map(function (key, i) {
				if (nAntworten[key].pt) {
					nAntworten[key].tags = [];
					nAntworten[key].pt.forEach(function (val) {
						nAntworten[key].tags.push({'e': val.e, 'tags': this.processTags(val.t).tags});
					}, this);
					delete nAntworten[key].pt;
				}
				this.setAAntwort(key, nAntworten[key]);
			}, this);
		},
		delAntwort: function (dAntwort) {
			if (dAntwort > 0) {
				this.setAAntwort(dAntwort);
			}
		},
		processTags: function (pTags, pPos = 0, gen = 0) {
			var xTags = [];
			var xPos = pPos;
			var xClose = 0;
			while (xPos < pTags.length && xClose < 1) {
				if (pTags[xPos].c > 0) {
					xClose = pTags[xPos].c;
					pTags[xPos].c -= 1;
					xPos = xPos - 1;
				} else {
					var prData = this.processTags(pTags, xPos + 1);
					var zTags = prData.tags;
					var zPos = prData.pos;
					xTags.push({'id': pTags[xPos].i, 'tag': pTags[xPos].t, 'tags': zTags});
					xPos = zPos + 1;
				}
			}
			return {'tags': xTags, 'pos': xPos};
		},
		setAAntwort: function (key, val = undefined) {
			if (val === undefined) { // Antwort Löschen
				if (this.aAntworten[key]['its'] && this.aTokenSets[this.aAntworten[key]['its']]) {
					delete this.aTokenSets[this.aAntworten[key]['its']].aId;
				}
				if (this.aAntworten[key]['it'] && this.aTokens[this.aAntworten[key]['it']]) {
					delete this.aTokens[this.aAntworten[key]['it']].aId;
				}
				this.delAntworten[key] = this.aAntworten[key];
				delete this.aAntworten[key];
			} else { // Antwort setzen
				if (key === 0 || isNaN(key)) { // Neue Antwort
					key = -1;
					while (this.aAntworten[key]) {
						key -= 1;
					}
					val.saveme = true;
				}
				this.aAntworten[key] = val;
				if (this.aAntworten[key]['its'] && this.aTokenSets[this.aAntworten[key]['its']]) {
					this.aTokenSets[this.aAntworten[key]['its']].aId = parseInt(key);
				}
				if (this.aAntworten[key]['it'] && this.aTokens[this.aAntworten[key]['it']]) {
					this.aTokens[this.aAntworten[key]['it']].aId = parseInt(key);
				}
			}
			return key;
		},
		/* deleteATokenSet: TokenSet löschen */
		deleteATokenSet: function (delTokenSetID, direkt = false, aDirekt = false) {
			if (direkt || confirm('Soll das TokenSet ID ' + delTokenSetID + ' gelöscht werden?')) {
				$('#aTokenSetInfo').modal('hide');
				if (this.aTokenSets[delTokenSetID].aId && ((aDirekt) || confirm('Soll die dazugehörige Antwort auch gelöscht werden?'))) {
					this.setAAntwort(this.aTokenSets[delTokenSetID].aId);
				}
				this.delTokenSets[delTokenSetID] = this.aTokenSets[delTokenSetID];
				delete this.aTokenSets[delTokenSetID];
				this.unsaved = true;
				this.aTokenSetInfo = undefined;
				this.selTokenSet = 0;
				this.updateATokenSets();
				this.focusFocusCatch();
				console.log('TokenSet ID ' + delTokenSetID + ' gelöscht!');
			}
		},
		/* updateTokenSetData: TokenSet ändern */
		updateTokenSetData: function () {
			var aTSPK = this.aTokenSetInfo['pk'];
			$('#aTokenSetInfo').modal('hide');
			if (this.aTokenSetInfo.aId) {
				this.aTokenSets[aTSPK].aId = this.setAAntwort(parseInt(this.aTokenSetInfo.aId), {'its': aTSPK, 'vi': this.aTokens[(this.aTokenSetInfo.t || this.aTokenSetInfo.tx)[0]].i, 'tags': ((this.aTokenSetInfo.tags) ? JSON.parse(JSON.stringify(this.aTokenSetInfo.tags)) : undefined)});
				this.aAntworten[this.aTokenSets[aTSPK].aId].saveme = true;
			}
			if (this.aTokenSetInfo.delAntwort && this.aTokenSetInfo.aId > 0) {
				this.delAntwort(this.aTokenSetInfo.aId);
			}
			this.unsaved = true;
			this.updateATokenSets();
			this.aTokenSetInfo = undefined;
			console.log('TokenSet ID ' + aTSPK + ' geändert!');
		},
		/* updateTokenData: Token ändern */
		updateTokenData: function () {
			var aTPK = this.aTokenInfo['pk'];
			$('#aTokenInfo').modal('hide');
			this.aTokens[aTPK].t = this.aTokenInfo.t;
			this.aTokens[aTPK].tt = this.aTokenInfo.tt;
			this.aTokens[aTPK].o = this.aTokenInfo.o;
			this.aTokens[aTPK].le = this.aTokenInfo.le;
			this.aTokens[aTPK].to = this.aTokenInfo.to;
			if (this.aTokenInfo.aId) {
				this.aTokens[aTPK].aId = this.setAAntwort(parseInt(this.aTokenInfo.aId), {'it': aTPK, 'vi': this.aTokenInfo.i, 'tags': ((this.aTokenInfo.tags) ? JSON.parse(JSON.stringify(this.aTokenInfo.tags)) : undefined)});
				this.aAntworten[this.aTokens[aTPK].aId].saveme = true;
			}
			if (this.aTokenInfo.delAntwort && this.aTokenInfo.aId > 0) {
				this.delAntwort(this.aTokenInfo.aId);
			}
			this.aTokens[aTPK].saveme = true;
			this.unsaved = true;
			this.preRenderTEvent(this.getTEventOfAEvent(this.searchByKey(this.aTokenInfo.e, 'pk', this.aEvents)), true);
			this.updateZeilenTEvents();
			this.aTokenInfo = undefined;
			console.log('TokenSet ID ' + aTPK + ' geändert!');
		},
		/* updateToken */
		updateToken: function (key, values) {
			this.aTokens[key] = values;
			if (this.aTokens[key]['fo']) {
				this.updateTokenFragment(key, this.aTokens[key]['fo']);
			}
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
		preRenderTEvent: function (key, rerender = false) {
			if (rerender || this.tEvents[key]['rerender']) {
				this.tEvents[key]['svgWidth'] = this.sizeTEvent(key);
				this.tEvents[key]['rerender'] = false;
			}
		},
		sizeTEvent: function (key) {
			var mW = 0;
			Object.keys(this.aInformanten).map(function (iKey, iI) {	// Informanten durchzählen
				Object.keys(this.tEvents[key]['eId']).map(function (eKey, eI) {
					if (eKey === iKey) {
						var aW = 0;
						this.aEvents[this.tEvents[key]['eId'][eKey]]['tid'][iKey].forEach(function (aTokenId) {
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
		updateInfShow: function () {
			this.updateZeilenTEvents();
			this.debouncedSVGHeight();
		},
		/* updateZeilenTEvents */
		updateZeilenTEvents: function () {
			var t0 = performance.now();
			var aWidth = this.zInfWidth;
			this.zeilenTEvents = [];
			var aZTEv = 0;
			this.zeilenTEvents[aZTEv] = {'eId': [], 'eH': 0, 'iId': [], 'eT': 0, 'tId': {'all': []}, 'tsId': {'all': []}, 'tsH': {'all': 0}, 'tsT': {}, 'tsIdZ': {}, 'tsZi': {}};
			var eTop = 0;
			this.zeilenHeight = 0;
			this.tEvents.forEach(function (val, key) {
				this.tEvents[key]['svgLeft'] = aWidth - this.zInfWidth;
				aWidth += val['svgWidth'] + 0.5;
				if (aWidth < this.mWidth - 25) {
					this.zeilenTEvents[aZTEv]['eId'].push(key);
				} else {
					this.uzteEndDataUpdate(aZTEv);
					this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
					eTop = this.zeilenTEvents[aZTEv]['eT'] + this.zeilenTEvents[aZTEv]['eH'];
					aWidth = this.zInfWidth + val['svgWidth'];
					aZTEv++;
					this.tEvents[key]['svgLeft'] = 0;
					this.zeilenTEvents[aZTEv] = {'eId': [key], 'eH': 0, 'iId': [], 'eT': eTop, 'tId': {'all': []}, 'tsId': {'all': []}, 'tsH': {'all': 0}, 'tsT': {}, 'tsIdZ': {}, 'tsZi': {}};
				}
			}, this);
			this.uzteEndDataUpdate(aZTEv);
			this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
			this.scrollRendering();
			var t1 = performance.now();
			console.log('updateZeilenTEvents: ' + Math.ceil(t1 - t0) + ' ms');
		},
		uzteEndDataUpdate: function (aZTEv) {
			// console.log(this.zeilenTEvents[aZTEv]);
			this.zeilenTEvents[aZTEv]['eId'].forEach(function (val, key) {
				var tEvent = this.tEvents[val];
				Object.keys(tEvent['eId']).map(function (iKey, iI) {
					if (this.aInformanten[iKey].show) {
						if (this.zeilenTEvents[aZTEv]['iId'].indexOf(iKey) < 0) {
							this.zeilenTEvents[aZTEv]['iId'].push(iKey);
						}
						var aEvent = this.aEvents[tEvent['eId'][iKey]];
						aEvent['tid'][iKey].forEach(function (aTokenId, tidKey) {
							if (!this.zeilenTEvents[aZTEv]['tId'][iKey]) {
								this.zeilenTEvents[aZTEv]['tId'][iKey] = [];
							}
							if (this.zeilenTEvents[aZTEv]['tId']['all'].indexOf(aTokenId) < 0) {
								this.zeilenTEvents[aZTEv]['tId']['all'].push(aTokenId);
								this.zeilenTEvents[aZTEv]['tId'][iKey].push(aTokenId);
								if (this.aTokens[aTokenId]['tokenSets']) {
									this.aTokens[aTokenId]['tokenSets'].forEach(function (aTokenSetId, tsidKey) {
										if (this.zeilenTEvents[aZTEv]['tsId']['all'].indexOf(aTokenSetId) < 0) {
											if (!this.zeilenTEvents[aZTEv]['tsId'][iKey]) {
												this.zeilenTEvents[aZTEv]['tsId'][iKey] = [];
											}
											this.zeilenTEvents[aZTEv]['tsId']['all'].push(aTokenSetId);
											this.zeilenTEvents[aZTEv]['tsId'][iKey].push(aTokenSetId);
										}
									}, this);
								}
							}
						}, this);
					}
				}, this);
			}, this);
			Object.keys(this.aInformanten).map(function (iKey, iI) {
				var tsIdZp = 0;
				if (this.zeilenTEvents[aZTEv]['iId'].indexOf(iKey) > -1) {
					var aZteStart = this.aTokenReihung.indexOf(this.zeilenTEvents[aZTEv]['tId'][iKey][0]);
					var aZteEnde = this.aTokenReihung.indexOf(this.zeilenTEvents[aZTEv]['tId'][iKey][this.zeilenTEvents[aZTEv]['tId'][iKey].length - 1]);
					if (this.zeilenTEvents[aZTEv]['tsId'][iKey]) {
						this.zeilenTEvents[aZTEv]['tsIdZ'][iKey] = [];
						this.zeilenTEvents[aZTEv]['tsZi'][iKey] = {};
						// TokenSets sortieren:
						this.zeilenTEvents[aZTEv]['tsId'][iKey] = this.sortTokenSets(this.zeilenTEvents[aZTEv]['tsId'][iKey]);
						// TokenSets in Zeilen laden:
						if (!this.zeilenTEvents[aZTEv]['tsIdZ'][iKey]) { this.zeilenTEvents[aZTEv]['tsIdZ'][iKey] = []; };
						this.zeilenTEvents[aZTEv]['tsId'][iKey].some(function (tsId) {
							// TokenSets sortieren:
							var aSetT = (this.aTokenSets[tsId].t || this.aTokenSets[tsId].tx);
							var atSetStart = this.aTokenReihung.indexOf(aSetT[0]);
							var atSetEnde = this.aTokenReihung.indexOf(aSetT[aSetT.length - 1]);
							var aDeep = this.zeilenTEvents[aZTEv]['tsIdZ'][iKey].length;
							this.zeilenTEvents[aZTEv]['tsIdZ'][iKey].some(function (y, yD) {
								var aOk = true;
								y.forEach(function (x) {
									var tSet = (this.aTokenSets[x].t || this.aTokenSets[x].tx);
									if (atSetStart <= this.aTokenReihung.indexOf(tSet[tSet.length - 1]) && atSetEnde >= this.aTokenReihung.indexOf(tSet[0])) {
										aOk = false;
										return true;
									}
								}, this);
								if (aOk) {
									aDeep = yD;
									return true;
								}
							}, this);
							if (!this.zeilenTEvents[aZTEv]['tsIdZ'][iKey][aDeep]) {
								this.zeilenTEvents[aZTEv]['tsIdZ'][iKey][aDeep] = [];
							}
							this.zeilenTEvents[aZTEv]['tsIdZ'][iKey][aDeep].push(tsId);
							// Zusätzliche Daten für SVG Darstellung der Token Sets hinzufügen:
							this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId] = {};
							this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['sT'] = ((atSetStart < aZteStart) ? undefined : aSetT[0]);
							this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['eT'] = ((atSetEnde > aZteEnde) ? undefined : aSetT[aSetT.length - 1]);
							if (this.aTokenSets[tsId].tx) {
								this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['sX'] = ((atSetStart < aZteStart) ? undefined : (this.tEvents[this.getTEventOfAEvent(this.searchByKey(this.aTokens[aSetT[0]].e, 'pk', this.aEvents))].svgLeft + this.aTokens[aSetT[0]].svgLeft));
								this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['eX'] = ((atSetEnde > aZteEnde) ? undefined : (this.tEvents[this.getTEventOfAEvent(this.searchByKey(this.aTokens[aSetT[aSetT.length - 1]].e, 'pk', this.aEvents))].svgLeft + this.aTokens[aSetT[aSetT.length - 1]].svgLeft + this.aTokens[aSetT[aSetT.length - 1]].svgWidth));
							} else {
								this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['sX'] = ((atSetStart < aZteStart) ? undefined : (this.tEvents[this.getTEventOfAEvent(this.searchByKey(this.aTokens[aSetT[0]].e, 'pk', this.aEvents))].svgLeft + this.aTokens[aSetT[0]].svgLeft + (this.aTokens[aSetT[0]].svgWidth / 2)));
								this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['eX'] = ((atSetEnde > aZteEnde) ? undefined : (this.tEvents[this.getTEventOfAEvent(this.searchByKey(this.aTokens[aSetT[aSetT.length - 1]].e, 'pk', this.aEvents))].svgLeft + this.aTokens[aSetT[aSetT.length - 1]].svgLeft + (this.aTokens[aSetT[aSetT.length - 1]].svgWidth / 2)));
								this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['tX'] = [];
								aSetT.forEach(function (val) {
									if (this.zeilenTEvents[aZTEv]['tId'][iKey].indexOf(val) > -1) {
										var aToken = this.aTokens[val];
										this.zeilenTEvents[aZTEv]['tsZi'][iKey][tsId]['tX'].push(this.tEvents[this.getTEventOfAEvent(this.searchByKey(aToken.e, 'pk', this.aEvents))].svgLeft + aToken.svgLeft + (aToken.svgWidth / 2));
									}
								}, this);
							}
							tsIdZp = this.zeilenTEvents[aZTEv]['tsIdZ'][iKey].length - 1;
						}, this);
						tsIdZp += 1;
						// Sortierung optimieren:
						var dChange = true;
						for (var m = 0; (m < 10 && dChange); m++) {
							dChange = false;
							for (var i = this.zeilenTEvents[aZTEv]['tsIdZ'][iKey].length - 2; i >= 0; i--) {
								this.zeilenTEvents[aZTEv]['tsIdZ'][iKey][i].forEach(function (aVal, aIndex) {
									var aSetT = (this.aTokenSets[aVal].t || this.aTokenSets[aVal].tx);
									var atSetStart = this.aTokenReihung.indexOf(aSetT[0]);
									var atSetEnde = this.aTokenReihung.indexOf(aSetT[aSetT.length - 1]);
									var aOk = true;
									this.zeilenTEvents[aZTEv]['tsIdZ'][iKey][i + 1].some(function (nVal, nIndex) {
										var nSetT = (this.aTokenSets[nVal].t || this.aTokenSets[nVal].tx);
										if (atSetStart <= this.aTokenReihung.indexOf(nSetT[nSetT.length - 1]) && atSetEnde >= this.aTokenReihung.indexOf(nSetT[0])) {
											aOk = false;
											return true;
										}
									}, this);
									if (aOk) {
										dChange = true;
										this.zeilenTEvents[aZTEv]['tsIdZ'][iKey][i + 1].push(this.zeilenTEvents[aZTEv]['tsIdZ'][iKey][i].splice(aIndex, 1)[0]);
									}
								}, this);
							}
						}
					}
					this.zeilenTEvents[aZTEv]['tsT'][iKey] = this.zeilenTEvents[aZTEv]['tsH']['all'];
					this.zeilenTEvents[aZTEv]['tsH'][iKey] = this.aTokenSetHeight * (tsIdZp);
					this.zeilenTEvents[aZTEv]['tsH']['all'] += this.zeilenTEvents[aZTEv]['tsH'][iKey];
				}
			}, this);
			var tsIdZpA = 0;
			if (this.zeilenTEvents[aZTEv]['tsIdZ']) {
				Object.keys(this.zeilenTEvents[aZTEv]['tsIdZ']).map(function (iKey, iI) {
					tsIdZpA += this.zeilenTEvents[aZTEv]['tsIdZ'][iKey].length;
				}, this);
			}
			this.zeilenTEvents[aZTEv]['eH'] = this.eEventHeight + (this.aTokenSetHeight * tsIdZpA) + (this.eInfHeight + this.eInfTop) * this.zeilenTEvents[aZTEv]['iId'].length;
		},
		/* getTokenString */
		getTokenString: function (tId, field, bfield = false) {
			var aTxt = this.getTokenFragment(tId, field, bfield);
			var space = ((this.aTokens[tId]['tt'] === 2) || (this.aTokens[tId]['fo'] > 0 || aTxt[0] === '_') ? '' : '\u00A0');
			if (aTxt[0] === '_') {
				aTxt = aTxt.substr(1);
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
			console.log('setATokenInfo', aKey, aVal);
			this.aTokenInfo[aKey] = aVal;
			this.$set(this.aTokenInfo, 'changed', true);
		},
		setATokenSetInfo: function (aVal, aKey) {
			console.log('setATokenSetInfo', aKey, aVal);
			this.aTokenSetInfo[aKey] = aVal;
			this.$set(this.aTokenSetInfo, 'changed', true);
		},
		setAudioDuration: function (aPos) {
			this.audioDuration = aPos;
		},
		ctrlKey: function () {
			this.ctrlKS = true;
		},
		/* showTEventInfos */
		showTEventInfos: function (event, tId) {
			if (event.ctrlKey) {
				var rect = event.target.getBoundingClientRect();
				console.log(this.$refs.audioplayer);
				this.$refs.audioplayer.setAudioPosBySec(this.tEvents[tId].as + ((this.tEvents[tId].ae - this.tEvents[tId].as) / rect.width * (event.clientX - rect.left)));
				this.ctrlKS = true;
			} else {
				this.tEventInfo = tId;
				setTimeout(function () { $('#tEventInfo').modal('show'); }, 20);
			}
		},
		/* showaInfInfos */
		showaInfInfos: function (iId) {
			this.aInfInfo = iId;
			setTimeout(function () { $('#aInformantenInfo').modal('show'); }, 20);
		},
		/* showaTokenSetInfos */
		showaTokenSetInfos: function (eTokSet, direkt = false, e = undefined) {
			if (direkt || (this.selTokenSet === eTokSet && (!e || (!e.ctrlKey && !e.shiftKey)))) {
				this.aTokenSetInfo = JSON.parse(JSON.stringify(this.aTokenSets[eTokSet]));
				if (this.aTokenSetInfo.aId && this.aAntworten[this.aTokenSetInfo.aId].tags) {
					this.aTokenSetInfo.tags = JSON.parse(JSON.stringify(this.aAntworten[this.aTokenSetInfo.aId].tags));
				}
				this.aTokenSetInfo['pk'] = eTokSet;
				let aVToken;
				let aBToken;
				let aVTokenOrg;
				let aBTokenOrg;
				if (this.aTokenSetInfo.ivt) {
					aVToken = this.aTokenSetInfo.ivt;
				}
				if (this.aTokenSetInfo.ibt) {
					aBToken = this.aTokenSetInfo.ibt;
				}
				if (this.aTokenSetInfo.t) {
					aVToken = this.aTokenSetInfo.t[0];
					aBToken = this.aTokenSetInfo.t[this.aTokenSetInfo.t.length - 1];
				}
				if (aVToken) {
					this.aTokenSetInfo['satzView'] = [];
					if (!aBToken) { aBToken = aVToken; };
					aVTokenOrg = aVToken;
					aBTokenOrg = aBToken;
					// this.aTokenSetInfo['satzView'].push({text: aVToken + ' - ' + aBToken, class: 'test'});
					// Satzanfang und -ende ermitteln
					if (this.aTokens[aVToken].s) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aVToken].i].indexOf(aVToken);
						if (aTokPos > -1) {
							while (aTokPos > 0 && this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos]] && this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos]].s === this.aTokens[aVToken].s) {
								aTokPos -= 1;
							}
							if (this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos + 1]]) {
								aVToken = this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos + 1];
							}
						}
					}
					if (this.aTokens[aBToken].s) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aBToken].i].indexOf(aBToken);
						if (aTokPos > -1) {
							while (aTokPos < this.aTokenReihungInf[this.aTokens[aBToken].i].length && this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos]] && this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos]].s === this.aTokens[aBToken].s) {
								aTokPos += 1;
							}
							if (this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos - 1]]) {
								aBToken = this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos - 1];
							}
						}
					}
					// this.aTokenSetInfo['satzView'].push({text: aVToken + ' - ' + aBToken, class: 'test'});
					let aTokPosV = this.aTokenReihungInf[this.aTokens[aVToken].i].indexOf(aVToken);
					if (aTokPosV > -1) {
						aTokPosV -= 10;
						if (aTokPosV < 0) { aTokPosV = 0; };
						if (this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosV]]) {
							aVToken = this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosV];
						}
					}
					let aTokPosB = this.aTokenReihungInf[this.aTokens[aBToken].i].indexOf(aBToken);
					if (aTokPosB > -1) {
						aTokPosB += 10;
						if (aTokPosB > this.aTokenReihungInf[this.aTokens[aBToken].i].length - 1) { aTokPosB = this.aTokenReihungInf[this.aTokens[aBToken].i].length - 1; };
						if (this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosB]]) {
							aBToken = this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosB];
						}
					}
					// this.aTokenSetInfo['satzView'].push({text: aVToken + ' - ' + aBToken, class: 'test'});
					if (aVTokenOrg !== aVToken) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].indexOf(aVToken);
						let aText = '';
						let aOrtho = '';
						while (aTokPos < this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].length && this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos] !== aVTokenOrg) {
							let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos]];
							aText += ' ' + aTok.t;
							aOrtho += ' ' + aTok.o || aTok.t;
							aTokPos += 1;
						}
						this.aTokenSetInfo['satzView'].push({text: aText, ortho: aOrtho, class: 'before'});
					}
					if (aVTokenOrg && aBTokenOrg) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].indexOf(aVTokenOrg);
						let aText = '';
						let aOrtho = '';
						while (aTokPos < this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].length && this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos] !== aBTokenOrg) {
							let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos]];
							aText += ' ' + aTok.t;
							aOrtho += ' ' + aTok.o || aTok.t;
							aTokPos += 1;
						}
						if (this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos] === aBTokenOrg) {
							let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos]];
							aText += ' ' + aTok.t;
							aOrtho += ' ' + aTok.o || aTok.t;
						}
						this.aTokenSetInfo['satzView'].push({text: aText, ortho: aOrtho, class: 'active'});
					}
					console.log(aVToken + ' - ' + aBToken);
				}
				if (aBTokenOrg !== aBToken) {
					let aTokPos = this.aTokenReihungInf[this.aTokens[aBTokenOrg].i].indexOf(aBTokenOrg) + 1;
					let aText = '';
					let aOrtho = '';
					while (aTokPos < this.aTokenReihungInf[this.aTokens[aBTokenOrg].i].length && this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos] !== aBToken) {
						let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aBTokenOrg].i][aTokPos]];
						aText += ' ' + aTok.t;
						aOrtho += ' ' + aTok.o || aTok.t;
						aTokPos += 1;
					}
					if (this.aTokenReihungInf[this.aTokens[aBTokenOrg].i][aTokPos] === aBToken) {
						let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aBTokenOrg].i][aTokPos]];
						aText += ' ' + aTok.t;
						aOrtho += ' ' + aTok.o || aTok.t;
					}
					this.aTokenSetInfo['satzView'].push({text: aText, ortho: aOrtho, class: 'after'});
				}
				// this.aTokenSetInfo['satzView'] = [{text: 'test', ortho: 'test Ortho', class: 'test'}];
				setTimeout(function () { $('#aTokenSetInfo').modal('show'); }, 20);
			} else {
				this.selTokenSet = ((this.selTokenSet === eTokSet) ? 0 : eTokSet);
				if (e.ctrlKey) { this.ctrlKS = true; };
			}
		},
		/* showaTokenInfos */
		showaTokenInfos: function (eTok, direkt = false, e = undefined) {
			if (direkt || (this.selToken === eTok && (!e || (!e.ctrlKey && !e.shiftKey)))) {
				// console.log('Token auswählen', eTok, direkt, e);
				this.aTokens[eTok]['viewed'] = true;
				this.svgTokenLastView = eTok;
				this.aTokenInfo = JSON.parse(JSON.stringify(this.aTokens[eTok]));
				if (this.aTokenInfo.aId && this.aAntworten[this.aTokenInfo.aId].tags) {
					this.aTokenInfo.tags = JSON.parse(JSON.stringify(this.aAntworten[this.aTokenInfo.aId].tags));
				}
				this.aTokenInfo['pk'] = eTok;
				this.aTokenInfo['e-txt'] = this.aEvents[this.searchByKey(this.aTokens[eTok]['e'], 'pk', this.aEvents)]['s'];
				let aVToken = eTok;
				let aBToken = eTok;
				let aVTokenOrg;
				let aBTokenOrg;
				if (aVToken) {
					this.aTokenInfo['satzView'] = [];
					if (!aBToken) { aBToken = aVToken; };
					aVTokenOrg = aVToken;
					aBTokenOrg = aBToken;
					// this.aTokenInfo['satzView'].push({text: aVToken + ' - ' + aBToken, class: 'test'});
					// Satzanfang und -ende ermitteln
					if (this.aTokens[aVToken].s) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aVToken].i].indexOf(aVToken);
						if (aTokPos > -1) {
							while (aTokPos > 0 && this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos]] && this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos]].s === this.aTokens[aVToken].s) {
								aTokPos -= 1;
							}
							if (this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos + 1]]) {
								aVToken = this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPos + 1];
							}
						}
					}
					if (this.aTokens[aBToken].s) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aBToken].i].indexOf(aBToken);
						if (aTokPos > -1) {
							while (aTokPos < this.aTokenReihungInf[this.aTokens[aBToken].i].length && this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos]] && this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos]].s === this.aTokens[aBToken].s) {
								aTokPos += 1;
							}
							if (this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos - 1]]) {
								aBToken = this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos - 1];
							}
						}
					}
					// this.aTokenInfo['satzView'].push({text: aVToken + ' - ' + aBToken, class: 'test'});
					let aTokPosV = this.aTokenReihungInf[this.aTokens[aVToken].i].indexOf(aVToken);
					if (aTokPosV > -1) {
						aTokPosV -= 10;
						if (aTokPosV < 0) { aTokPosV = 0; };
						if (this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosV]]) {
							aVToken = this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosV];
						}
					}
					let aTokPosB = this.aTokenReihungInf[this.aTokens[aBToken].i].indexOf(aBToken);
					if (aTokPosB > -1) {
						aTokPosB += 10;
						if (aTokPosB > this.aTokenReihungInf[this.aTokens[aBToken].i].length - 1) { aTokPosB = this.aTokenReihungInf[this.aTokens[aBToken].i].length - 1; };
						if (this.aTokens[this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosB]]) {
							aBToken = this.aTokenReihungInf[this.aTokens[aVToken].i][aTokPosB];
						}
					}
					// this.aTokenInfo['satzView'].push({text: aVToken + ' - ' + aBToken, class: 'test'});
					if (aVTokenOrg !== aVToken) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].indexOf(aVToken);
						let aText = '';
						let aOrtho = '';
						while (aTokPos < this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].length && this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos] !== aVTokenOrg) {
							let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos]];
							aText += ' ' + aTok.t;
							aOrtho += ' ' + aTok.o || aTok.t;
							aTokPos += 1;
						}
						this.aTokenInfo['satzView'].push({text: aText, ortho: aOrtho, class: 'before'});
					}
					if (aVTokenOrg && aBTokenOrg) {
						let aTokPos = this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].indexOf(aVTokenOrg);
						let aText = '';
						let aOrtho = '';
						while (aTokPos < this.aTokenReihungInf[this.aTokens[aVTokenOrg].i].length && this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos] !== aBTokenOrg) {
							let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos]];
							aText += ' ' + aTok.t;
							aOrtho += ' ' + aTok.o || aTok.t;
							aTokPos += 1;
						}
						if (this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos] === aBTokenOrg) {
							let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aVTokenOrg].i][aTokPos]];
							aText += ' ' + aTok.t;
							aOrtho += ' ' + aTok.o || aTok.t;
						}
						this.aTokenInfo['satzView'].push({text: aText, ortho: aOrtho, class: 'active'});
					}
					console.log(aVToken + ' - ' + aBToken);
				}
				if (aBTokenOrg !== aBToken) {
					let aTokPos = this.aTokenReihungInf[this.aTokens[aBTokenOrg].i].indexOf(aBTokenOrg) + 1;
					let aText = '';
					let aOrtho = '';
					while (aTokPos < this.aTokenReihungInf[this.aTokens[aBTokenOrg].i].length && this.aTokenReihungInf[this.aTokens[aBToken].i][aTokPos] !== aBToken) {
						let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aBTokenOrg].i][aTokPos]];
						aText += ' ' + aTok.t;
						aOrtho += ' ' + aTok.o || aTok.t;
						aTokPos += 1;
					}
					if (this.aTokenReihungInf[this.aTokens[aBTokenOrg].i][aTokPos] === aBToken) {
						let aTok = this.aTokens[this.aTokenReihungInf[this.aTokens[aBTokenOrg].i][aTokPos]];
						aText += ' ' + aTok.t;
						aOrtho += ' ' + aTok.o || aTok.t;
					}
					this.aTokenInfo['satzView'].push({text: aText, ortho: aOrtho, class: 'after'});
				}
				// this.aTokenInfo['satzView'] = [{text: 'test', ortho: 'test Ortho', class: 'test'}];
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
						(this.svgSelTokenList.slice()).forEach(function (val) {
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
					this.svgSelTokenList = [];
				}
			}
			this.selToken = eTok;
		},
		modalSperren: function (modalID) {
			$(modalID).off('keyup.dismiss.bs.modal');
			$(modalID).off('keydown.dismiss.bs.modal');
			$(modalID).data('bs.modal').options.backdrop = 'static';
			$(modalID + ' button.close').hide();
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
		objectSubValueFilter: function (obj, key, value) {
			var nObj = {};
			Object.keys(obj).map(function (iKey, iI) {
				if (obj[iKey][key] === value) {
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
			}
			return ((isNaN(s)) ? 0.0 : s);
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
			} else if (e.ctrlKey && e.keyCode === 13) { // Enter
				if (this.selTokenSet !== 0) {
					this.showaTokenSetInfos(this.selTokenSet, true);
				}
				this.ctrlKS = true;
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
				this.svgSelTokenList = [];
			} else if (e.ctrlKey && e.keyCode === 65) { // Strg + A
				this.ctrlKS = true;
				if (this.selToken) {
					if (this.aTokens[this.selToken].tokenSets && this.aTokens[this.selToken].tokenSets.length > 0) {
						if (!e.shiftKey) {
							if (this.aTokens[this.selToken].tokenSets.indexOf(this.selTokenSet) < this.aTokens[this.selToken].tokenSets.length - 1) {
								this.selTokenSet = this.aTokens[this.selToken].tokenSets[this.aTokens[this.selToken].tokenSets.indexOf(this.selTokenSet) + 1];
							} else {
								this.selTokenSet = this.aTokens[this.selToken].tokenSets[0];
							}
						} else {
							if (this.aTokens[this.selToken].tokenSets.indexOf(this.selTokenSet) > 0) {
								this.selTokenSet = this.aTokens[this.selToken].tokenSets[this.aTokens[this.selToken].tokenSets.indexOf(this.selTokenSet) - 1];
							} else {
								this.selTokenSet = this.aTokens[this.selToken].tokenSets[this.aTokens[this.selToken].tokenSets.length - 1];
							}
						}
					}
				}
			} else if (e.ctrlKey && e.keyCode === 81) { // Strg + Q
				this.ctrlKS = true;
				this.selTokenSet = 0;
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
			if (this.tEvents[0]) {
				if (aTId < 0) {	// Erster/Letzer Token
					return ((next) ? this.aTokenReihung[0] : this.aTokenReihung[this.aTokenReihung.length - 1]);
				} else {	// Nächster/Vorheriger Token
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
				this.aTokenSets[aTokSetId] = {'ivt': this.selTokenBereich.v, 'ibt': this.selTokenBereich.b, 'ok': false, 'saveme': true};
				this.unsaved = true;
				this.selTokenBereich = {'v': -1, 'b': -1};
				this.svgSelTokenList = [];
			} else if (this.selTokenListe.length > 0) {
				this.aTokenSets[aTokSetId] = {'t': this.selTokenListe.slice(), 'ok': false, 'saveme': true};
				this.unsaved = true;
				this.selTokenListe = [];
				this.svgSelTokenList = [];
			}
			this.updateATokenSets();
			this.focusFocusCatch();
		},
		/* TokenSet Bereich neu setzen */
		setATokenSetBereich: function (aTokenSetId, aTokenId, feld, direkt = false) {
			if (this.aTokens[aTokenId].i !== this.aTokens[this.aTokenSets[aTokenSetId].ivt].i) {
				alert('Der Token muss den selben Informanten haben!');
				return;
			}
			if (feld === 'ivt') {
				if (this.aTokenReihung.indexOf(this.aTokenSets[aTokenSetId].ibt) <= this.aTokenReihung.indexOf(aTokenId)) {
					alert('Der "Von Token" muss vor dem "Bis Token" liegen!');
					return;
				} else {
					if (direkt || confirm('Den "Von Token" von Token Set ID ' + aTokenSetId + ' wirklich neu setzen?')) {
						this.aTokenSets[aTokenSetId].ivt = aTokenId;
					} else { return; };
				}
			} else if (feld === 'ibt') {
				if (this.aTokenReihung.indexOf(this.aTokenSets[aTokenSetId].ivt) >= this.aTokenReihung.indexOf(aTokenId)) {
					alert('Der "Bis Token" muss nach dem "Von Token" liegen!');
					return;
				} else {
					if (direkt || confirm('Den "Bis Token" von Token Set ID ' + aTokenSetId + ' wirklich neu setzen?')) {
						this.aTokenSets[aTokenSetId].ibt = aTokenId;
					} else { return; };
				}
			}
			this.aTokenSets[aTokenSetId].ok = false;
			this.aTokenSets[aTokenSetId].saveme = true;
			this.unsaved = true;
			this.updateATokenSets();
			this.focusFocusCatch();
		},
		/* TokenSet Liste Token hinzufügen/entfernen */
		toggleATokenSetListe: function (aTokenSetId, aTokenId, direkt = false) {
			if (this.aTokens[aTokenId].i !== this.aTokens[this.aTokenSets[aTokenSetId].t[0]].i) {
				alert('Der Token muss den selben Informanten haben!');
				return;
			}
			if (this.aTokenSets[aTokenSetId].t.indexOf(aTokenId) > -1) {
				if (this.aTokenSets[aTokenSetId].t.length < 2) {
					alert('TokenSets müssen mindestens einen Token enthalten!');
					return;
				}
				if (direkt || confirm('Den Token "' + this.aTokens[aTokenId].t + '" ID ' + aTokenId + ' aus Token Set ID ' + aTokenSetId + ' wirklich löschen?')) {
					this.aTokenSets[aTokenSetId].t.splice(this.aTokenSets[aTokenSetId].t.indexOf(aTokenId), 1);
				} else { return; };
			} else {
				if (direkt || confirm('Den Token "' + this.aTokens[aTokenId].t + '" ID ' + aTokenId + ' zu Token Set ID ' + aTokenSetId + ' hinzufügen?')) {
					this.aTokenSets[aTokenSetId].t.push(aTokenId);
				} else { return; };
			}
			this.aTokenSets[aTokenSetId].ok = false;
			this.aTokenSets[aTokenSetId].saveme = true;
			this.unsaved = true;
			this.updateATokenSets();
			this.focusFocusCatch();
		},
		updateATokenSets: function () {
			console.log('updateATokenSets');
			Object.keys(this.aTokens).map(function (tId, iI) {
				if (this.aTokens[tId].tokenSets) {
					_.remove(this.aTokens[tId].tokenSets, (n) => {
						return (!this.aTokenSets[n] || !this.aTokenSets[n].ok);
					});
					if (this.aTokens[tId].tokenSets.length < 1) {
						delete this.aTokens[tId].tokenSets;
					}
				}
			}, this);
			Object.keys(this.aTokenSets).map(function (aTokSetId, iI) {
				if (!this.aTokenSets[aTokSetId].ok) {
					var aTokSetIdInt = parseInt(aTokSetId);
					if (this.aTokenSets[aTokSetId].ivt) {
						var aInf = this.aTokens[this.aTokenSets[aTokSetId].ivt].i;
						if (this.aTokenReihungInf[aInf].indexOf(this.aTokenSets[aTokSetId].ivt >= 0 && this.aTokenReihungInf[aInf].indexOf(this.aTokenSets[aTokSetId].ibt >= 0))) {
							if (this.aTokenSets[aTokSetId].ivt > this.aTokenSets[aTokSetId].ibt) {
								var temp = this.aTokenSets[aTokSetId].ivt;
								this.aTokenSets[aTokSetId].ivt = this.aTokenSets[aTokSetId].ibt;
								this.aTokenSets[aTokSetId].ibt = temp;
							}
							var aList = JSON.parse(JSON.stringify(this.aTokenReihungInf[aInf]));
							this.aTokenSets[aTokSetId].tx = aList.splice(aList.indexOf(this.aTokenSets[aTokSetId].ivt), aList.indexOf(this.aTokenSets[aTokSetId].ibt) + 1 - aList.indexOf(this.aTokenSets[aTokSetId].ivt));
							this.aTokenSets[aTokSetId].ok = true;
						}
					} else if (this.aTokenSets[aTokSetId].t && this.listeWerteInListe(this.aTokenSets[aTokSetId].t, this.aTokenReihung)) {
						this.aTokenSets[aTokSetId].t = this.sortEventIdListe(this.aTokenSets[aTokSetId].t);
						this.aTokenSets[aTokSetId].ok = true;
					}
					var xt = this.aTokenSets[aTokSetId].t || this.aTokenSets[aTokSetId].tx;
					if (xt) {
						xt.forEach(function (tId) {
							if (!this.aTokens[tId].tokenSets) {
								this.aTokens[tId].tokenSets = [];
							}
							if (this.aTokens[tId].tokenSets.indexOf(aTokSetIdInt) < 0) {
								this.aTokens[tId].tokenSets.push(aTokSetIdInt);
							}
							this.aTokens[tId].tokenSets = this.sortTokenSets(this.aTokens[tId].tokenSets);
						}, this);
					}
				}
			}, this);
			this.updateZeilenTEvents();
		},
		checkSelTokenBereich: function () {
			if (this.selTokenBereich.v >= 0 && this.selTokenBereich.b >= 0) {
				var aInf = this.aTokens[this.selTokenBereich.v].i;
				if ((aInf !== this.aTokens[this.selTokenBereich.b].i) || this.selTokenBereich.v === this.selTokenBereich.b) {
					this.selTokenBereich = {'v': -1, 'b': -1};
					this.svgSelTokenList = [];
					return true;
				}
				this.selTokenListe = [];
				var aList = JSON.parse(JSON.stringify(this.aTokenReihungInf[aInf]));
				var sTBv = this.selTokenBereich.v;
				var sTBb = this.selTokenBereich.b;
				if (sTBv > sTBb) { var temp = sTBv; sTBv = sTBb; sTBb = temp; }
				this.svgSelTokenList = aList.splice(aList.indexOf(sTBv), aList.indexOf(sTBb) + 1 - aList.indexOf(sTBv));
			} else {
				if (this.selTokenListe.length < 1) {
					this.svgSelTokenList = [];
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
			this.svgSelTokenList = this.selTokenListe;
		},
		reRenderSelToken: function () {
			var tSelToken = this.selToken;
			this.selToken = -1;
			this.$nextTick(() => { this.selToken = tSelToken; });
		},
		sucheZuAuswahlListe: function () {
			this.suchTokens.forEach(function (val) {
				if (this.selTokenListe.indexOf(val) < 0) {
					this.updateSelTokenListe(val);
				}
			}, this);
			this.focusFocusCatch();
		},
		/* Properties von Objekt filtern */
		filterProperties: function (obj, props) {
			var output = {};
			Object.keys(obj).map(function (key, i) {
				if (props.indexOf(key) > -1) {
					output[key] = obj[key];
				}
			}, this);
			return output;
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
		},
		sortTokenSets: function (tokSets) {
			return tokSets.slice().sort((a, b) => {
				var xa = this.aTokenReihung.indexOf((this.aTokenSets[a].t || this.aTokenSets[a].tx)[0]);
				var xb = this.aTokenReihung.indexOf((this.aTokenSets[b].t || this.aTokenSets[b].tx)[0]);
				if (xa > xb) { return 1; }
				if (xa < xb) { return -1; }
				var aTSa = this.aTokenSets[a].t || this.aTokenSets[a].tx;
				var aTSb = this.aTokenSets[b].t || this.aTokenSets[b].tx;
				xa = this.aTokenReihung.indexOf(aTSa[aTSa.length - 1]);
				xb = this.aTokenReihung.indexOf(aTSb[aTSb.length - 1]);
				if (xa < xb) { return 1; }
				if (xa > xb) { return -1; }
				if (this.aTokenSets[a].t && this.aTokenSets[b].tx) { return 1; }
				if (this.aTokenSets[a].tx && this.aTokenSets[b].t) { return -1; }
				return 0;
			});
		},
		aTokenInfoChange: function (nVal, oVal) {
			if (this.aTokenInfo && oVal !== undefined) { this.$set(this.aTokenInfo, 'changed', true); };
		}
	},
	mounted: function () {
		document.getElementById('svgscroller').addEventListener('scroll', this.scrollRendering);
		window.addEventListener('resize', this.resizeWindow);
		this.resizeWindow();
		this.getMenue();
		/* Wenn Modal angezeigt wird */
		$(document).on('shown.bs.modal', '.modal', function (e) {
			if ($(this).data('focus')) {
				$($(this).data('focus')).focus();
			}
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
		this.debouncedUpdateInfShow = _.debounce(this.updateInfShow, 100);
		this.debouncedUpdateATokenSets = _.debounce(this.updateATokenSets, 100);
		this.debouncedupdateZeilenTEvents = _.debounce(this.updateZeilenTEvents, 50);
	},
	beforeDestroy: function () {
		document.getElementById('svgscroller').removeEventListener('scroll', this.scrollRendering);
		window.removeEventListener('resize', this.resizeWindow);
	}
});
