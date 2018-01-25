/* global $ performance */

function searchbypk (nameKey, myArray) {
	for (var i = 0; i < myArray.length; i++) {
		if (myArray[i].pk === nameKey) {
			return i;
		}
	}
}

function newAnnotationForm (data) {
	var t0 = performance.now();
	console.log(data);
	$('.mcon').html('<div id="annotationstool"></div><div id="annotationstoolvorlage"></div>');

	var infWidth = 0;
	var aCont = '<div class="annotationszeile"><div class="infstitel">';
	var aeCont = '<div class="event">';
	$.each(data['aInformanten'], function (k, v) {
		aCont += '<div class="inftitel infid' + k + '" title="ID: ' + k + '" data-id="' + k + '">' + v['k'] + '</div>';
		aeCont += '<div class="infe infid' + k + '"><div class="notoken">&nbsp;</div></div>';
	});
	$.each(data['aTokens'], function (k, v) {
		var aEventKey = searchbypk(v['e'], data['aEvents']);
		if (data['aEvents'][aEventKey]['tid']) {
			data['aEvents'][aEventKey]['tid'].push(k);
		} else {
			data['aEvents'][aEventKey]['tid'] = [k];
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
	var nline = true;
	var aWidth = 0;
	$.each(data['aEvents'], function (k, v) {
		if (k < 10) {
			if (nline) {
				nline = false;
				aline += 1;
				$('#annotationstoolvorlage>.annotationszeile').clone().addClass('az' + aline).appendTo('#annotationstool');
				aWidth = infWidth;
			};
			var ac = 'eid' + v['pk'];
			if (aeventpline === 1) {
				ac += ' fc';
			};
			$('#annotationstoolvorlage>.event').clone().addClass(ac).appendTo('#annotationstool>.annotationszeile.az' + aline);
			$.each(v['tid'], function (k2, v2) {
				var aToken = data['aTokens'][v2];
				$('#annotationstool>.annotationszeile.az' + aline + ' .event.eid' + v['pk'] + '>.infe.infid' + aToken['i']).append('<div class="token" data-id="' + v2 + '">' + ((aToken['tt'] === 2) ? '' : '&nbsp;') + aToken['t'] + '</div>');
			});
			aeventpline += 1;
			// console.log($('#annotationstool>.annotationszeile.az' + aline + ' .event.eid' + v['pk']).width());
		};
	});

	$('#annotationstool').data('data', data);
	var t1 = performance.now();
	console.log('newAnnotationForm: ' + Math.ceil(t1 - t0) + ' ms.');
};
