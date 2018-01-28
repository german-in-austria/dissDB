/* global $ performance */

var rTTimer;
var aData;

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
	console.log(aData);
	$('.mcon').html('<div id="atloading">Daten werden verarbeitet ... <span>0</span> %</div><div id="annotationstool"></div><div id="annotationstoolvorlage"></div>');
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

	// Token IDs zu Events zuordnen.
	$.each(aData['aTokens'], function (k, v) {
		var aEventKey = searchbypk(v['e'], aData['aEvents']);
		if (aData['aEvents'][aEventKey]['tid']) {
			aData['aEvents'][aEventKey]['tid'].push(k);
		} else {
			aData['aEvents'][aEventKey]['tid'] = [k];
		};
	});

	// Events mit selber Startzeit markieren
	$.each(aData['aEvents'], function (k, v) {
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
						var aToken = aData['aTokens'][v2];
						aClass = 'token';
						if (aToken['fo'] > 0) {
							aClass += ' fragment';
						};
						if (!aTokenCach[aToken['i']]) { aTokenCach[aToken['i']] = ''; };
						aTokenCach[aToken['i']] += '<div class="' + aClass + '" data-id="' + v2 + '">' + (((aToken['tt'] === 2) || (aToken['fo'] > 0)) ? '' : '&nbsp;') + aToken['t'] + '</div>';
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
			$('#atloading').remove();
			var t2 = performance.now();
			console.log('renderTokens: ' + Math.ceil(t2 - t0) + ' ms.');
		}
	};
	var t1 = performance.now();
	console.log('newAnnotationForm: ' + Math.ceil(t1 - t0) + ' ms.');
};
