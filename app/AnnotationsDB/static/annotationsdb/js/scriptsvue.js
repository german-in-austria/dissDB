/* global _ $ d3 csrf Vue alert performance makeModal */

const eEventHeight = 40;
const eInfHeight = 63;
const eInfTop = 25;
const zInfWidth = 100;

class TranskriptClass {
	constructor (aTokenTypes = {}, aInformanten = {}, aInfLen = 0, aSaetze = {}, aEvents = [], aTokens = {}, aTokenFragmente = {}, tEvents = [], zeilenTEvents = [], zeilenTEventsRefresh = true, zeilenHeight = 0, d3eventsize = {}) {
		this.aTokenTypes = aTokenTypes;
		this.aInformanten = aInformanten;
		this.aInfLen = aInfLen;
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
		this.d3TokenLastView = -1;
	}
	reset () {
		this.aTokenTypes = {};
		this.aInformanten = {};
		this.aInfLen = 0;
		this.aSaetze = {};
		this.aEvents = [];
		this.tEvents = [];
		this.aTokens = {};
		this.aTokenFragmente = {};
		this.zeilenTEvents = [];
		this.zeilenTEventsRefresh = true;
		this.zeilenHeight = 0;
		this.d3eventsize = d3.select('#svg-g-eventsize');
		this.d3TokenLastView = -1;
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
		this.aInfLen = Object.keys(nInformanten).length;
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
			this.tEvents[key]['svgWidth'] = this.renderTEvent(key, this.d3eventsize, true);
			this.tEvents[key]['rerender'] = false;
		}
	}
	updateZeilenTEvents () {
		this.zeilenTEventsRefresh = true;
		var mWidth = $('#annotationsvg').width() - 25;
		var aWidth = zInfWidth;
		this.zeilenTEvents = [{'eId': [], 'eH': 0, 'iId': []}];
		var aZTEv = 0;
		this.zeilenHeight = 0;
		this.tEvents.forEach(function (val, key) {
			aWidth += val['svgWidth'];
			if (aWidth < mWidth) {
				this.zeilenTEvents[aZTEv]['eId'].push(key);
				Object.keys(val['eId']).map(function (iKey, iI) {
					if (this.zeilenTEvents[aZTEv]['iId'].indexOf(iKey) < 0) {
						this.zeilenTEvents[aZTEv]['iId'].push(iKey);
					}
				}, this);
				if ((eEventHeight + (eInfHeight + eInfTop) * this.aInfLen) > this.zeilenTEvents[aZTEv]['eH']) {
					this.zeilenTEvents[aZTEv]['eH'] = (eEventHeight + (eInfHeight + eInfTop) * this.zeilenTEvents[aZTEv]['iId'].length);
				}
			} else {
				this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
				aWidth = zInfWidth + val['svgWidth'];
				aZTEv++;
				this.zeilenTEvents[aZTEv] = {'eId': [key], 'eH': 0, 'iId': []};
				Object.keys(val['eId']).map(function (iKey, iI) {
					if (this.zeilenTEvents[aZTEv]['iId'].indexOf(iKey) < 0) {
						this.zeilenTEvents[aZTEv]['iId'].push(iKey);
					}
				}, this);
				this.zeilenTEvents[aZTEv]['eH'] = eEventHeight + (eInfHeight + eInfTop) * this.zeilenTEvents[aZTEv]['iId'].length;
			}
		}, this);
		this.zeilenHeight += this.zeilenTEvents[aZTEv]['eH'];
	}
	renderTEvent (key, d3target, fast, iId = []) {
		if (fast) {
			var mW = 0;
			var aSTTS = document.getElementById('svg-text-textsize');
			Object.keys(this.aInformanten).map(function (iKey, iI) {	// Informanten durchzählen
				Object.keys(this.tEvents[key]['eId']).map(function (eKey, eI) {
					if (eKey === iKey) {
						var aEvent = this.aEvents[this.tEvents[key]['eId'][eKey]];
						var aTokensIds = aEvent['tid'][iKey];
						var aW = 0;
						var t1W = 0;
						var t2W = 0;
						aTokensIds.forEach(function (aTokenId) {
							aSTTS.textContent = this.getTokenString(aTokenId, 't');
							t1W = aSTTS.getBBox().width;
							aSTTS.textContent = this.getTokenString(aTokenId, 'o', 't');
							t2W = aSTTS.getBBox().width;
							if (t1W > t2W) {
								aW += t1W + 1.5;
							} else {
								aW += t2W + 1.5;
							}
						}, this);
						if (aW > mW) {
							mW = aW;
						}
					}
				}, this);
			}, this);
			return mW + 2;
		} else {
			var bW = 0;
			var iAI = 0;
			Object.keys(this.aInformanten).map(function (iKey, iI) {	// Informanten durchzählen
				if (iId.indexOf(iKey) >= 0) {
					var d3eInf = d3target.append('g').attr('transform', 'translate(0,' + (eInfTop + iAI * (eInfHeight + eInfTop)) + ')').attr('class', 'eInf eInf' + iKey).attr('data-einf', iKey);
					d3eInf.append('rect').attr('x', 0).attr('y', 0).attr('width', 10).attr('height', eInfHeight - 10);
					Object.keys(this.tEvents[key]['eId']).map(function (eKey, eI) {
						if (eKey === iKey) {
							var aEvent = this.aEvents[this.tEvents[key]['eId'][eKey]];
							var aTokensIds = aEvent['tid'][iKey];
							var aX = 1;
							aTokensIds.forEach(function (aTokenId) {
								var d3aToken = d3eInf.append('g').attr('transform', 'translate(' + aX + ',1)').attr('class', 'eTok eTok' + aTokenId).attr('data-etok', aTokenId);
								if (this.aTokens[aTokenId]['viewed']) {
									d3aToken.classed('viewed', true);
								}
								if (this.d3TokenLastView === aTokenId) {
									d3aToken.classed('lastview', true);
								}
								var d3aTokenRec = d3aToken.append('rect').attr('x', -0.5).attr('y', 0).attr('width', 1).attr('height', eInfHeight - 12);
								d3aToken.append('text').attr('x', 0).attr('y', 18).text(this.getTokenString(aTokenId, 't'));
								d3aToken.append('text').attr('x', 0).attr('y', 43).text(this.getTokenString(aTokenId, 'o', 't'));
								var aW = d3aToken.node().getBBox().width;
								aX += aW + 1;
								d3aTokenRec.attr('width', aW + 1.5);
								if (this.aTokens[aTokenId]['fo']) {
									d3aToken.append('line').attr('x2', 3).attr('y1', eInfHeight - 10.5)
																					.attr('x1', aW).attr('y2', eInfHeight - 10.5)
																					.attr('class', 'blue').attr('marker-end', 'url(#arrow-blue)');
								}
								if (this.aTokenFragmente[aTokenId]) {
									d3aToken.append('line').attr('x1', 0).attr('y1', eInfHeight - 10.5)
																					.attr('x2', aW - 3).attr('y2', eInfHeight - 10.5)
																					.attr('class', 'green').attr('marker-end', 'url(#arrow-green)');
								}
							}, this);
						}
					}, this);
					var aW = d3eInf.node().getBBox().width;
					if (aW > bW) {
						bW = aW;
					}
					d3eInf.select('rect').attr('width', bW + 1);
					iAI++;
				}
			}, this);
			d3target.selectAll('g.eInf>rect').attr('width', bW + 1.5);
		}
	}
	renderZInformant (d3target, iId) {
		var aZInfs = d3target.append('g').attr('class', 'zInfs');
		var iAI = 0;
		Object.keys(this.aInformanten).map(function (iKey, iI) {
			if (iId.indexOf(iKey) >= 0) {
				var aZinf = aZInfs.append('g').attr('class', 'zInf zInf' + iKey).attr('data-zinf', iKey)
													.attr('transform', 'translate(5,' + ((eEventHeight - 25) + eInfTop + iAI * (eInfHeight + eInfTop)) + ')');
				aZinf.append('rect').attr('x', 0).attr('y', 4.5)
														.attr('width', zInfWidth).attr('height', eInfHeight - 9);
				aZinf.append('line').attr('x1', 0).attr('y1', 4.5)
														.attr('x2', zInfWidth).attr('y2', 4.5);
				aZinf.append('line').attr('x1', 0).attr('y1', eInfHeight - 4.5)
														.attr('x2', zInfWidth).attr('y2', eInfHeight - 4.5);
				aZinf.append('text').attr('class', 'zInfI').attr('x', 5).attr('y', 12 + (eInfHeight - 12) / 2).text(this.aInformanten[iKey]['k']);
				aZinf.append('text').attr('class', 'zInfLI').attr('x', zInfWidth - 5).attr('y', 18 + 6).text('t');
				aZinf.append('text').attr('class', 'zInfLI').attr('x', zInfWidth - 5).attr('y', 43 + 6).text('o');
				iAI++; // ToDo: Wenn aktiv!
			}
		}, this);
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
																								.append('g').attr('class', 'eZeile').attr('data-ezeile', key)
																								.attr('transform', 'translate(0,' + aTop + ')');
					this.zeilenTEvents[key]['d3obj'].append('rect').attr('x', 0).attr('y', 0).attr('width', mWidth).attr('height', (eEventHeight + (eInfHeight + eInfTop) * val['iId'].length) - 20);
					this.renderZInformant(this.zeilenTEvents[key]['d3obj'], val['iId']);
					var aX = zInfWidth + 5;
					this.zeilenTEvents[key]['eId'].forEach(function (eVal, eKey) {
						var d3tEg = this.zeilenTEvents[key]['d3obj'].append('g').attr('class', 'tEvent').attr('data-tevent', eVal).attr('transform', 'translate(' + aX + ',' + (eEventHeight - 20) + ')');
						this.renderTEvent(eVal, d3tEg, false, val['iId']);
						var tEgW = d3tEg.node().getBBox().width;
						aX += tEgW;
						var d3tEgZ = d3tEg.append('g').attr('class', 'zeit');
						d3tEgZ.append('rect').attr('x', 0).attr('y', -15).attr('width', tEgW).attr('height', 11);
						d3tEgZ.append('line').attr('x1', 0).attr('y1', -15).attr('x2', 0).attr('y2', -4);
						d3tEgZ.append('text').attr('x', 4).attr('y', -6).text(secondsToDuration(durationToSeconds(this.tEvents[eVal]['s']), 3));
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
	getTokenString (tId, field, bfield = false) {
		var space = '\u00A0';
		var aTxt = this.getTokenFragment(tId, field, bfield);
		if ((this.aTokens[tId]['tt'] === 2) || (this.aTokens[tId]['fo'] > 0)) {
			space = '';
		}
		if (aTxt[0] === '_') {
			aTxt = aTxt.substr(1);
			space = '';
		};
		if (aTxt[aTxt.length - 1] === '_') {
			aTxt = aTxt.substr(0, aTxt.length - 1);
		};
		return space + aTxt;
	}
	getTokenFragment (tId, field, bfield = false) {
		var aTtxt = this.aTokens[tId][field];
		if (bfield && !aTtxt) {
			aTtxt = this.aTokens[tId][bfield];
		}
		if (this.aTokenFragmente[tId]) {
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
	}
};

var transkript = new TranskriptClass();

document.addEventListener('scroll', function (event) {
	if (event.target.id === 'svgscroller') {
		transkript.scrollRendering();
	}
}, true);

$(document).on('click', 'g.eTok', function (e) {
	var eTok = $(this).data('etok');
	transkript.aTokens[eTok]['viewed'] = true;
	transkript.d3TokenLastView = eTok;
	var aTokenD = transkript.aTokens[eTok];
	d3.selectAll('g.eTok').classed('lastview', false);
	d3.select(this).classed('lastview', true).classed('viewed', true);
	var aTitel = 'Token: <b>' + aTokenD['t'] + '</b>';
	var aBody = '';
	aBody += formGroup('ID', '<p class="form-control-static" id="aTokenID">' + eTok + '</p>', 'aTokenID');
	aBody += formGroup('text', '<input type="text" class="form-control" id="aTokenText" value="' + ((aTokenD['t']) ? aTokenD['t'] : '') + '">', 'aTokenText');
	var aSel = '';
	$.each(transkript.aTokenTypes, function (k, v) {
		aSel += '<option value="' + v + '"' + ((Number(k) === aTokenD['tt']) ? ' selected' : '') + '>' + v['n'] + '</option>';
	});
	aBody +=	formGroup('token_type', '<select class="form-control" id="aTokenType">' + aSel + '</select>', 'aTokenType');
	aBody += formGroup('ortho', '<input type="text" class="form-control" id="aTokenOrtho" value="' + ((aTokenD['o']) ? aTokenD['o'] : '') + '">', 'aTokenOrtho');
	aBody += formGroup('ID_Inf', '<p class="form-control-static" id="aTokenIDInf">' + transkript.aInformanten[aTokenD['i']]['k'] + '(' + transkript.aInformanten[aTokenD['i']]['ka'] + ') - ID: ' + aTokenD['i'] + '</p>', 'aTokenIDInf');
	if (aTokenD['fo']) {
		aBody += formGroup('fragment_of', '<p class="form-control-static" id="aTokenfragmentof">' + transkript.aTokens[aTokenD['fo']]['t'] + ' - ID: ' + aTokenD['fo'] + '</p>', 'aTokenfragmentof');
	};
	aBody += formGroup('token_reihung', '<p class="form-control-static" id="aTokenReihung">' + ((aTokenD['tr']) ? aTokenD['tr'] : '') + '</p>', 'aTokenReihung');
	aBody += formGroup('event_id', '<p class="form-control-static" id="aTokenEventID">' + transkript.aEvents[searchbypk(aTokenD['e'], transkript.aEvents)]['s'] + ' - ID: ' + aTokenD['e'] + '</p>', 'aTokenEventID');
	aBody += formGroup('likely_error', '<label class="checkbox-inline"><input type="checkbox" id="aTokenLikelyError" value="1"' + ((aTokenD['le'] === 1) ? ' checked' : '') + '> Ja</label>', 'aTokenLikelyError');
	if (aTokenD['s']) {
		aBody += formGroup('sentence_id', '<p class="form-control-static" id="aTokenSentenceID">' + transkript.aSaetze[aTokenD['s']]['t'] + ' - ID: ' + aTokenD['s'] + '</p>', 'aTokenSentenceID');
	};
	if (aTokenD['sr']) {
		aBody += formGroup('sequence_in_sentence', '<p class="form-control-static" id="aTokenSequenceInSentence">' + aTokenD['sr'] + '</p>', 'aTokenSequenceInSentence');
	};
	aBody += formGroup('text_in_ortho', '<input type="text" class="form-control" id="aTokenTextInOrtho" value="' + ((aTokenD['to']) ? aTokenD['to'] : '') + '">', 'aTokenTextInOrtho');
	if (transkript.aTokenFragmente[eTok]) {
		var aFrags = '';
		$.each(transkript.aTokenFragmente[eTok], function (k, v) {
			aFrags += '<li>' + transkript.aTokens[v]['t'] + ' (' + v + ')</li>';
		});
		aBody += formGroup('Fragmente', '<ul class="form-control-static hflist">' + aFrags + '</ul>');
	};
	aBody = '<div class="form-horizontal">' + aBody + '</div>';
	makeModal(aTitel, aBody, 'tokeninfos', '<button type="button" class="btn btn-danger" id="delToken" tabindex="9999" disabled>Löschen</button><button type="button" class="btn btn-primary" id="saveToken" disabled>Speichern</button>');
});

$(document).on('click', 'g.zInf', function (e) {
	var aInf = $(this).data('zinf');
	var aTitel = 'Informant';
	var aBody = '';
	aBody += '<div class="form-horizontal">';
	aBody += formGroup('ID', '<p class="form-control-static">' + aInf + '</p>');
	aBody += formGroup('Kürzel', '<p class="form-control-static">' + transkript.aInformanten[aInf]['k'] + '</p>');
	aBody += formGroup('Kürzel Anonym', '<p class="form-control-static">' + transkript.aInformanten[aInf]['ka'] + '</p>');
	aBody += '</div>';
	makeModal(aTitel, aBody, 'aInformantenInfo', '');
});

$(document).on('click', 'g.tEvent > .zeit', function (e) {
	var aTEvent = $(this).parent().data('tevent');
	var aTitel = 'Events';
	var aBody = '';
	aBody += '<div class="form-horizontal">' + formGroup('Zeit', '<p class="form-control-static">' + transkript.tEvents[aTEvent]['s'] + ' -  ' + transkript.tEvents[aTEvent]['e'] + '</p>') + '</div>';
	Object.keys(transkript.aInformanten).map(function (iKey, iI) {
		var aEId = transkript.tEvents[aTEvent]['eId'][iKey];
		if (aEId >= 0) {
			aBody += '<hr>';
			aBody += '<div class="form-horizontal">';
			aBody += formGroup('Informant', '<p class="form-control-static">' + transkript.aInformanten[iKey]['k'] + ' (' + transkript.aInformanten[iKey]['ka'] + ' - Id: ' + iKey + ')' + '</p>');
			aBody += formGroup('ID', '<p class="form-control-static">' + transkript.aEvents[aEId]['pk'] + '</p>');
			aBody += formGroup('Start', '<p class="form-control-static">' + transkript.aEvents[aEId]['s'] + '</p>');
			aBody += formGroup('Ende', '<p class="form-control-static">' + transkript.aEvents[aEId]['e'] + '</p>');
			aBody += formGroup('Layer', '<p class="form-control-static">' + transkript.aEvents[aEId]['l'] + '</p>');
			var aTxt = '';
			Object.keys(transkript.aEvents[aEId]['tid']).map(function (iKey, iI) {
				aTxt += '<b>' + iKey + ':</b> ';
				var aMax = transkript.aEvents[aEId]['tid'][iKey].length - 1;
				transkript.aEvents[aEId]['tid'][iKey].forEach(function (val, i) {
					aTxt += val + ((i < aMax) ? ', ' : '');
				});
				aTxt += '<br>';
			});
			aBody += formGroup('Token IDs', '<p class="form-control-static">' + aTxt + '</p>');
			aBody += '</div>';

			console.log(transkript.aEvents[aEId]);
		}
	});
	makeModal(aTitel, aBody, 'tEventInfo', '');
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

/* Sonstiges */
function formGroup (aTitle, aContent, aId = false) {
	return '<div class="form-group">' +
						'<label' + ((aId) ? ' for="' + aId + '"' : '') + ' class="col-sm-3 control-label">' + aTitle + '</label>' +
						'<div class="col-sm-9">' + aContent + '</div>' +
					'</div>';
}
function searchbypk (nameKey, myArray) {
	for (var i = 0; i < myArray.length; i++) {
		if (myArray[i].pk === nameKey) {
			return i;
		}
	}
}

/* Audioplayer */
function durationToSeconds (hms) {
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
}
function secondsToDuration (sec, fix = 6) {
	var v = '';
	if (sec < 0) { sec = -sec; v = '-'; }
	var h = parseInt(sec / 3600);
	sec %= 3600;
	var m = parseInt(sec / 60);
	var s = sec % 60;
	return v + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s.toFixed(fix)).slice(-(3 + fix));
}
