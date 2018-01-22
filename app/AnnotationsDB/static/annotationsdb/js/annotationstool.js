/* global $ performance */

function searchbypk (nameKey, myArray) {
	for (var i = 0; i < myArray.length; i++) {
		if (myArray[i].pk === nameKey) {
			return i;
		}
	}
}

$.fn.newAnnotationForm = function (data) {
	var t0 = performance.now();
	console.log(data);
	$(this).html('<div id="annotationstool"></div><div id="annotationstoolvorlage"></div>');

	var maxInfWidth = 0;
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
	$('.inftitel').each(function () {
		if (maxInfWidth < $(this).width()) {
			maxInfWidth = $(this).width();
		};
	}).width(maxInfWidth);
	$('#annotationstoolvorlage').css('display', 'none');

	var aline = 1;
	var aeventpline = 1;
	$('#annotationstoolvorlage>.annotationszeile').clone().addClass('az' + aline).appendTo('#annotationstool');
	$.each(data['aEvents'], function (k, v) {
		if (k < 100) {
			var ac = 'eid' + v['pk'];
			if (aeventpline === 1) {
				ac += ' fc';
			};
			$('#annotationstoolvorlage>.event').clone().addClass(ac).appendTo('#annotationstool>.annotationszeile.az' + aline);
			$.each(v['tid'], function (k2, v2) {
				var aToken = data['aTokens'][v2];
				$('#annotationstool>.annotationszeile.az' + aline + ' .event.eid' + v['pk'] + '>.infe.infid' + aToken['i']).append('<div class="token">' + ((aToken['tt'] === 2) ? '' : '&nbsp;') + aToken['t'] + '</div>');
			});
			aeventpline += 1;
			// console.log($('#annotationstool>.annotationszeile.az' + aline + ' .event.eid' + v['pk']).width());
		};
	});

	$('#annotationstool').data('data', data);
	var t1 = performance.now();
	console.log('newAnnotationForm: ' + Math.ceil(t1 - t0) + ' ms.');
};
