/* global $ performance makeModal confirm alert */

var rTTimer;
var aData;
var selToken = false;

function searchbypk (nameKey, myArray) {
	for (var i = 0; i < myArray.length; i++) {
		if (myArray[i].pk === nameKey) {
			return i;
		}
	}
}

function newAnnotationForm (data) {
	aData = data;
	var t0 = performance.now();
	var aError = '';
	console.log(aData);
	activeToken();
	$('.mcon').removeClass('ready').addClass('loading').html('<div id="atloading">Daten werden verarbeitet ... <span>0</span> %</div><div id="annotationstool"></div><div id="annotationstoolvorlage"></div>');
	// Vorlage für Zeilen erstellen
	var infWidth = 0;
	var aCont = '<div class="annotationszeile"><div class="infstitel">';
	var aeCont = '<div class="event">';
	$.each(aData['aInformanten'], function (k, v) {
		aCont += '<div class="inftitel infid' + k + '" title="ID: ' + k + '" data-id="' + k + '">' + v['k'] + '</div>';
		aeCont += '<div class="infe infid' + k + '" data-id="' + k + '"><div class="notoken">&nbsp;</div></div>';
	});
	$('#annotationstoolvorlage').append(aCont + '</div></div>');
	$('#annotationstoolvorlage').append(aeCont + '</div>');
	$('#annotationstoolvorlage .inftitel').each(function () {
		if (infWidth < $(this).width()) {
			infWidth = $(this).width();
		};
	}).width(infWidth);
	var azWidth = $('#annotationstoolvorlage .annotationszeile').width();
	$('#annotationstoolvorlage').css('display', 'none');

	// Token Daten verarbeiten
	$.each(aData['aTokens'], function (k, v) {
		// Verweisende Fragmente zuordnen
		if (v['fo']) {
			if (!aData['aTokens'][v['fo']]) {
				aData['aTokens'][k]['error'] = true;
				aError += '\nToken ID: ' + k + ' - ' + (aData['aTokens'][k]['errortxt'] = 'Token mit ID ' + v['fo'] + ' für "fragment_of" wurde nicht geladen!');
			} else {
				if (aData['aTokens'][v['fo']]['hf']) {
					aData['aTokens'][v['fo']]['hf'].push(k);
				} else {
					aData['aTokens'][v['fo']]['hf'] = [k];
				}
			}
		};
		// Token IDs zu Events zuordnen.
		var aEventKey = searchbypk(v['e'], aData['aEvents']);
		if (aData['aEvents'][aEventKey]['tid']) {
			aData['aEvents'][aEventKey]['tid'].push(k);
		} else {
			aData['aEvents'][aEventKey]['tid'] = [k];
		};
	});

	// Event Daten verarbeiten
	$.each(aData['aEvents'], function (k, v) {
		// Events mit selber Startzeit markieren
		if (k < aData['aEvents'].length - 1 && aData['aEvents'][k]['s'] === aData['aEvents'][k + 1]['s']) {
			aData['aEvents'][k]['syncn'] = true;
		}
		if (k > 0 && aData['aEvents'][k]['s'] === aData['aEvents'][k - 1]['s']) {
			aData['aEvents'][k]['syncp'] = true;
		}
	});

	var aline = 0;
	var aeventpline = 1;
	var aEventK = 0;
	var v = {};
	var aZeileObj;
	var lZeileObj;
	addNewLine();
	renderTokens();

	// Events mit Token rendern.
	function addNewLine () {
		aline += 1;
		aeventpline = 1;
		lZeileObj = aZeileObj;
		aZeileObj = $('#annotationstoolvorlage>.annotationszeile').clone().addClass('az' + aline).appendTo('#annotationstool');
	}
	function renderToken (aID) {
		var aClass;
		var aToken = aData['aTokens'][aID];
		aClass = 'token';
		if (aToken['fo'] > 0) {
			aClass += ' fragment';
		};
		if (aToken['error']) {
			aClass += ' error';
		};
		return '<div class="' + aClass + '" data-id="' + aID + '">' + (((aToken['tt'] === 2) || (aToken['fo'] > 0)) ? '' : '&nbsp;') + aToken['t'] + '</div>';
	};
	function renderTokens () {
		if (aEventK < aData['aEvents'].length) {
			$('#atloading>span').html((100 / (aData['aEvents'].length - 1) * aEventK).toFixed(1));
			var vk = aEventK;
			var mk = vk + 50;
			if (mk > aData['aEvents'].length - 1) {
				mk = aData['aEvents'].length - 1;
			}
			for (var k = vk; k <= mk; k++) {
				// Event mit Token hinzufügen.
				v = aData['aEvents'][k];
				var aClass = '';
				if (aeventpline === 1) {
					aClass += 'fc';
				};
				var syncK = k;
				var syncKm = k;
				// Titel, Data und Klassen für Event erstellen
				var aTitle = '';
				var aDataF = [];
				var aV;
				while (syncK >= 0 && syncK < aData['aEvents'].length) {
					aV = aData['aEvents'][syncK];
					aTitle += 'ID: ' + aV['pk'] + ' | Zeit: ' + aV['s'] + ' - ' + aV['e'] + ' | Layer: ' + aV['l'] + String.fromCharCode(10);
					aDataF.push(aV['pk']);
					aClass += ' eid' + aV['pk'];
					if (aData['aEvents'][syncK]['syncn']) {
						syncK += 1;
					} else {
						syncK = -1;
					};
				};
				var aEventObj = $('#annotationstoolvorlage>.event').clone().addClass(aClass).data(aDataF).appendTo(aZeileObj);
				aEventObj.append('<div class="eventzeit" title="' + aTitle + '">' + v['s'] + '</div>');
				var aTokenCach = {};
				syncK = k;
				while (syncK >= 0 && syncK < aData['aEvents'].length) {
					aV = aData['aEvents'][syncK];
					$.each(aV['tid'], function (k2, v2) {
						if (!aTokenCach[aData['aTokens'][v2]['i']]) { aTokenCach[aData['aTokens'][v2]['i']] = ''; };
						aTokenCach[aData['aTokens'][v2]['i']] += renderToken(v2);
					});
					if (aData['aEvents'][syncK]['syncn']) {
						syncK += 1;
						syncKm = syncK;
					} else {
						syncK = -1;
					};
				};
				$.each(aTokenCach, function (k2, v2) {
					aEventObj.find('.infe.infid' + k2).html(v2);
				});
				aeventpline += 1;

				// Zeilenbreite überprüfen und ggf. Token in eine neue Zeile verschieben.
				if ($(aZeileObj).width() > azWidth) {
					if (aeventpline > 2) {
						addNewLine();
						aZeileObj.append(aEventObj.addClass('fc'));
						aeventpline += 1;
					} else {
						addNewLine();
					}
					$.each(aData['aInformanten'], function (k, v) {
						if (lZeileObj.find('.infid' + k + '>.token').length === 0) {
							lZeileObj.find('.infid' + k).addClass('leererinf');
						};
					});
				};
				k = syncKm;
			};
			aEventK = syncKm + 1;
			rTTimer = setTimeout(renderTokens, 1);
		} else {
			if (!aError) {
				$('#atloading').remove();
				$('.mcon').removeClass('loading').addClass('ready');
			} else {
				$('#atloading').html('Es gab eine Fehler bei der Datenverarbeitung!');
				$('#atloading').css('background', '#f88');
				alert(aError);
				console.log(aError);
			}
			var t2 = performance.now();
			console.log('renderTokens: ' + Math.ceil(t2 - t0) + ' ms.');
			$(':focus').blur();
			$('body').focus();
			nextToken();
		}
	};
	var t1 = performance.now();
	console.log('newAnnotationForm: ' + Math.ceil(t1 - t0) + ' ms.');
};

// Modal mit Tokendaten
$(document).on('click', '.mcon.ready .token', function (e) {
	activeToken($(this).data('id'));
	var aTokenD = aData['aTokens'][$(this).data('id')];
	function formGroup (aTitle, aContent, aId = false) {
		return '<div class="form-group">' +
							'<label' + ((aId) ? ' for="' + aId + '"' : '') + ' class="col-sm-3 control-label">' + aTitle + '</label>' +
							'<div class="col-sm-9">' + aContent + '</div>' +
						'</div>';
	}
	console.log(aTokenD);
	$('.token').removeClass('lastview');
	$(this).addClass('viewed lastview');
	var aTitel = 'Token: <b>' + aTokenD['t'] + '</b>';
	var aBody = '';
	aBody += formGroup('ID', '<p class="form-control-static" id="aTokenID">' + $(this).data('id') + '</p>', 'aTokenID');
	aBody += formGroup('text', '<input type="text" class="form-control" id="aTokenText" value="' + ((aTokenD['t']) ? aTokenD['t'] : '') + '">', 'aTokenText');
	var aSel = '';
	$.each(aData['aTokenTypes'], function (k, v) {
		aSel += '<option value="' + v + '"' + ((Number(k) === aTokenD['tt']) ? ' selected' : '') + '>' + v['n'] + '</option>';
	});
	aBody +=	formGroup('token_type', '<select class="form-control" id="aTokenType">' + aSel + '</select>', 'aTokenType');
	aBody += formGroup('ortho', '<input type="text" class="form-control" id="aTokenOrtho" value="' + ((aTokenD['o']) ? aTokenD['o'] : '') + '">', 'aTokenOrtho');
	aBody += formGroup('ID_Inf', '<p class="form-control-static" id="aTokenIDInf">' + aData['aInformanten'][aTokenD['i']]['k'] + '(' + aData['aInformanten'][aTokenD['i']]['ka'] + ') - ID: ' + aTokenD['i'] + '</p>', 'aTokenIDInf');
	if (aTokenD['fo']) {
		aBody += formGroup('fragment_of', '<p class="form-control-static" id="aTokenfragmentof">' + aData['aTokens'][aTokenD['fo']]['t'] + ' - ID: ' + aTokenD['fo'] + '</p>', 'aTokenfragmentof');
	};
	aBody += formGroup('token_reihung', '<p class="form-control-static" id="aTokenReihung">' + ((aTokenD['tr']) ? aTokenD['tr'] : '') + '</p>', 'aTokenReihung');
	aBody += formGroup('event_id', '<p class="form-control-static" id="aTokenEventID">' + aData['aEvents'][searchbypk(aTokenD['e'], aData['aEvents'])]['s'] + ' - ID: ' + aTokenD['e'] + '</p>', 'aTokenEventID');
	aBody += formGroup('likely_error', '<label class="checkbox-inline"><input type="checkbox" id="aTokenLikelyError" value="1"' + ((aTokenD['le'] === 1) ? ' checked' : '') + '> Ja</label>', 'aTokenLikelyError');
	if (aTokenD['s']) {
		aBody += formGroup('sentence_id', '<p class="form-control-static" id="aTokenSentenceID">' + aData['aSaetze'][aTokenD['s']]['t'] + ' - ID: ' + aTokenD['s'] + '</p>', 'aTokenSentenceID');
	};
	if (aTokenD['sr']) {
		aBody += formGroup('sequence_in_sentence', '<p class="form-control-static" id="aTokenSequenceInSentence">' + aTokenD['sr'] + '</p>', 'aTokenSequenceInSentence');
	};
	aBody += formGroup('text_in_ortho', '<input type="text" class="form-control" id="aTokenTextInOrtho" value="' + ((aTokenD['to']) ? aTokenD['to'] : '') + '">', 'aTokenTextInOrtho');
	if (aTokenD['hf']) {
		var aFrags = '';
		$.each(aTokenD['hf'], function (k, v) {
			aFrags += '<li>' + aData['aTokens'][v]['t'] + ' (' + v + ')</li>';
		});
		aBody += formGroup('Fragmente', '<ul class="form-control-static hflist">' + aFrags + '</ul>');
	};
	aBody = '<div class="form-horizontal">' + aBody + '</div>';
	makeModal(aTitel, aBody, 'tokeninfos', '<button type="button" class="btn btn-danger" id="delToken" tabindex="9999">Löschen</button><button type="button" class="btn btn-primary" id="saveToken">Speichern</button>');
});

$(document).on('click', '#js-modal.tokeninfos:not(.loading) #delToken', function (e) {
	if (confirm('Token wirklich unwiederruflich löschen?')) {
		// $('#js-modal.tokeninfos').addClass('loading');
		console.log('Löschen!');
	}
});

$(document).on('click', '#js-modal.tokeninfos:not(.loading) #saveToken', function (e) {
	console.log('Speichern!');
	// $('#js-modal.tokeninfos').addClass('loading');
});

// Token geändert?
$(document).on('change keyup', '#js-modal.tokeninfos input, #js-modal.tokeninfos select', function (e) {
	if (e.keyCode !== 9 && e.keyCode !== 16 && e.keyCode !== 37 && e.keyCode !== 39 && e.keyCode !== 13) {
		$('#js-modal.tokeninfos').addClass('changed');
	}
});

// Wenn Modal geschlossen wird
$(document).on('hide.bs.modal', '#js-modal.tokeninfos', function (e) {
	if ($('#js-modal.tokeninfos').hasClass('changed') && !confirm('Änderungen wirklich verwerfen?')) {
		e.preventDefault();
	}
	if ($('#js-modal.tokeninfos').hasClass('loading')) {
		e.preventDefault();
	}
});

// Wenn Modal angezeigt wird
$(document).on('shown.bs.modal', '#js-modal.tokeninfos', function (e) {
	$('#js-modal.tokeninfos').removeClass('loading');
	$('#aTokenText').focus();
});

// Tokenauswahl per Tastatur
$(document).on('keyup', 'body:not(.modal-open)', function (e) {
	if ($('.mcon.ready #annotationstool').length > 0) {
		if (e.keyCode === 37) {
			$(':focus').blur();
			prevToken();
		} else if (e.keyCode === 39) {
			$(':focus').blur();
			nextToken();
		} else if (e.keyCode === 38) {
			$(':focus').blur();
			prevInf();
		} else if (e.keyCode === 40) {
			$(':focus').blur();
			nextInf();
		} else if (e.keyCode === 13) {
			$(':focus').blur();
			$('.token[data-id="' + selToken + '"]').click();
		}
		// console.log(e.keyCode);
	};
});

// Aktuellen Token setzten
function activeToken (nSelect = false) {
	// console.log('Auswahl: ' + nSelect);
	$('.token').removeClass('selected');
	var aSelToken = $('.token[data-id="' + nSelect + '"]');
	if (nSelect && aSelToken.length > 0) {
		aSelToken.addClass('selected');
		selToken = nSelect;
		var astop = $('.mcon').scrollTop();
		var asbottom = astop + $('.mcon').innerHeight();
		var atop = astop + aSelToken.parent().parent().parent().offset().top - 100;
		var abottom = atop + aSelToken.parent().parent().parent().outerHeight(true) + 200;
		if (atop < astop) {
			$('.mcon').stop().animate({scrollTop: atop}, 250);
		} else if (abottom > asbottom) {
			$('.mcon').stop().animate({scrollTop: abottom - $('.mcon').innerHeight()}, 250);
		}
	} else {
		selToken = false;
	}
}

// Nächsten Token finden
function nextToken () {
	if (selToken && $('.token[data-id="' + selToken + '"]').length > 0) {
		var aToken = $('.token[data-id="' + selToken + '"]');
		var nToken = aToken.next();
		if (nToken.length === 0) {
			var aInfId = aToken.parent().data('id');
			var aEvent = aToken.parent().parent();
			var nEvent = aEvent.nextAll().has('.infe[data-id="' + aInfId + '"]>.token').first();
			if (nEvent.length === 0) {
				nEvent = aEvent.parent().nextAll(':lt(25)').has('.infe[data-id="' + aInfId + '"]>.token').first().find('.event').has('.infe[data-id="' + aInfId + '"]>.token').first();
				if (!nEvent || nEvent.length === 0) {
					nEvent = aEvent.parent().nextAll().has('.infe[data-id="' + aInfId + '"]>.token').first().find('.event').has('.infe[data-id="' + aInfId + '"]>.token').first();
				}
			}
			if (nEvent && nEvent.length > 0) {
				nToken = nEvent.find('.infe[data-id="' + aInfId + '"]>.token:first-child');
			}
		}
		if (nToken.length > 0) {
			activeToken(nToken.data('id'));
		} else {
			activeToken();
		}
	} else {
		activeToken($('.token').first().data('id'));
	}
}

// Vorherigen Token finden
function prevToken () {
	if (selToken && $('.token[data-id="' + selToken + '"]').length > 0) {
		var aToken = $('.token[data-id="' + selToken + '"]');
		var nToken = aToken.prev();
		if (nToken.length === 0) {
			var aInfId = aToken.parent().data('id');
			var aEvent = aToken.parent().parent();
			var nEvent = aEvent.prevAll().has('.infe[data-id="' + aInfId + '"]>.token').first();
			if (nEvent.length === 0) {
				nEvent = aEvent.parent().prevAll(':lt(25)').has('.infe[data-id="' + aInfId + '"]>.token').first().find('.event').has('.infe[data-id="' + aInfId + '"]>.token').last();
				if (!nEvent || nEvent.length === 0) {
					nEvent = aEvent.parent().prevAll().has('.infe[data-id="' + aInfId + '"]>.token').first().find('.event').has('.infe[data-id="' + aInfId + '"]>.token').last();
				}
			}
			if (nEvent && nEvent.length > 0) {
				nToken = nEvent.find('.infe[data-id="' + aInfId + '"]>.token:last-child');
			}
		}
		if (nToken.length > 0) {
			activeToken(nToken.data('id'));
		} else {
			activeToken();
		}
	} else {
		activeToken($('.token').last().data('id'));
	}
}

// Nächsten Informanten finden
function nextInf () {
	if (selToken && $('.token[data-id="' + selToken + '"]').length > 0) {
		var aToken = $('.token[data-id="' + selToken + '"]');
		var aInf = aToken.parent();
		var nInf = aInf.nextAll('.infe').has('.token').first();
		if (nInf.length === 0) {
			var aInfId = aInf.data('id');
			var nInfId = $('#annotationstoolvorlage .inftitel[data-id="' + aInfId + '"]').next();
			var aEvent = aInf.parent();
			var nEvent = false;
			if (nInfId.length > 0) {
				nInfId = nInfId.data('id');
				nEvent = aEvent.nextAll().has('.infe[data-id="' + nInfId + '"]>.token').first();
				nInf = nEvent.find('.infe[data-id="' + nInfId + '"]');
			}
			if (!nEvent || nEvent.length === 0) {
				nEvent = aEvent.parent().nextAll(':lt(25)').has('.infe>.token').first().find('.event').has('.infe>.token').first();
				nInf = nEvent.find('.infe').has('.token').first();
			}
		}
		if (nInf.length > 0) {
			activeToken(nInf.find('.token').first().data('id'));
		}
	}
}

// Vorherigen Informanten finden
function prevInf () {
	if (selToken && $('.token[data-id="' + selToken + '"]').length > 0) {
		var aToken = $('.token[data-id="' + selToken + '"]');
		var aInf = aToken.parent();
		var nInf = aInf.prevAll('.infe').has('.token').first();
		if (nInf.length === 0) {
			var aInfId = aInf.data('id');
			var nInfId = $('#annotationstoolvorlage .inftitel[data-id="' + aInfId + '"]').prev();
			var aEvent = aInf.parent();
			var nEvent = false;
			if (nInfId.length > 0) {
				nInfId = nInfId.data('id');
				nEvent = aEvent.nextAll().has('.infe[data-id="' + nInfId + '"]>.token').first();
				nInf = nEvent.find('.infe[data-id="' + nInfId + '"]');
			}
			if (!nEvent || nEvent.length === 0) {
				nEvent = aEvent.parent().prevAll(':lt(25)').has('.infe>.token').first().find('.event').has('.infe>.token').first();
				nInf = nEvent.find('.infe').has('.token').first();
			}
		}
		if (nInf.length > 0) {
			activeToken(nInf.find('.token').first().data('id'));
		}
	}
}
