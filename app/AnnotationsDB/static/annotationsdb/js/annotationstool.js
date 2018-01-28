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
	var infWidth = 0;
	var aCont = '<div class="annotationszeile"><div class="infstitel">';
	var aeCont = '<div class="event">';
	$.each(aData['aInformanten'], function (k, v) {
		aCont += '<div class="inftitel infid' + k + '" title="ID: ' + k + '" data-id="' + k + '">' + v['k'] + '</div>';
		aeCont += '<div class="infe infid' + k + '" data-id="' + k + '"><div class="notoken">&nbsp;</div></div>';
	});
	$.each(aData['aTokens'], function (k, v) {
		var aEventKey = searchbypk(v['e'], aData['aEvents']);
		if (aData['aEvents'][aEventKey]['tid']) {
			aData['aEvents'][aEventKey]['tid'].push(k);
		} else {
			aData['aEvents'][aEventKey]['tid'] = [k];
		};
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

	var aline = 0;
	var aeventpline = 1;
	var aEventK = 0;
	var v = {};
	var aZeileObj;
	var lZeileObj;
	addNewLine();
	renderTokens();

	// Alle Events mit Token rendern.
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
				v = aData['aEvents'][k];
				var ac = 'eid' + v['pk'];
				if (aeventpline === 1) {
					ac += ' fc';
				};
				// Event mit Token hinzufügen.
				var aEventObj = $('#annotationstoolvorlage>.event').clone().addClass(ac).appendTo(aZeileObj);
				aEventObj.append('<div class="eventzeit" title="' + ('Zeit: ' + v['s'] + ' - ' + v['e']) + String.fromCharCode(10) + 'Layer: ' + v['l'] + String.fromCharCode(10) + 'ID: ' + v['pk'] + '">' + v['s'] + '</div>');
				var aTokenCach = {};
				$.each(v['tid'], function (k2, v2) {
					var aToken = aData['aTokens'][v2];
					if (!aTokenCach[aToken['i']]) { aTokenCach[aToken['i']] = ''; };
					aTokenCach[aToken['i']] += '<div class="token" data-id="' + v2 + '">' + ((aToken['tt'] === 2) ? '' : '&nbsp;') + aToken['t'] + '</div>';
				});
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
			};
			aEventK = mk + 1;
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
