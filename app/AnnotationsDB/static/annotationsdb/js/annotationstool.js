/* global $ performance */

var rTTimer;

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
	$('.mcon').html('<div id="atloading">Lade ... <span>0</span> %</div><div id="annotationstool"></div><div id="annotationstoolvorlage"></div>');
	var infWidth = 0;
	var aCont = '<div class="annotationszeile"><div class="infstitel">';
	var aeCont = '<div class="event">';
	$.each(data['aInformanten'], function (k, v) {
		aCont += '<div class="inftitel infid' + k + '" title="ID: ' + k + '" data-id="' + k + '">' + v['k'] + '</div>';
		aeCont += '<div class="infe infid' + k + '" data-id="' + k + '"><div class="notoken">&nbsp;</div></div>';
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
	var aEventK = 0;
	var v = {};
	var aZeileObj;
	addNewLine();
	renderTokens();
	function addNewLine () {
		aline += 1;
		aZeileObj = $('#annotationstoolvorlage>.annotationszeile').clone().addClass('az' + aline).appendTo('#annotationstool');
		aeventpline = 1;
	}
	function renderTokens () {
		if (aEventK < data['aEvents'].length) {
			$('#atloading>span').html((100 / (data['aEvents'].length - 1) * aEventK).toFixed(1));
			var vk = aEventK;
			var mk = vk + 25;
			if (mk > data['aEvents'].length - 1) {
				mk = data['aEvents'].length - 1;
			}
			for (var k = vk; k <= mk; k++) {
				v = data['aEvents'][k];
				var ac = 'eid' + v['pk'];
				if (aeventpline === 1) {
					ac += ' fc';
				};
				var aEventObj = $('#annotationstoolvorlage>.event').clone().addClass(ac).appendTo(aZeileObj);
				$.each(v['tid'], function (k2, v2) {
					var aToken = data['aTokens'][v2];
					aEventObj.find('.infe.infid' + aToken['i']).append('<div class="token" data-id="' + v2 + '">' + ((aToken['tt'] === 2) ? '' : '&nbsp;') + aToken['t'] + '</div>');
				});
				aeventpline += 1;
				if ($(aZeileObj).width() > azWidth) {
					addNewLine();
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
	$('#annotationstool').data('data', data);
	var t1 = performance.now();
	console.log('newAnnotationForm: ' + Math.ceil(t1 - t0) + ' ms.');
};
