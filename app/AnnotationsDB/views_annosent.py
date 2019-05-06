from django.shortcuts import render_to_response
from django.template import RequestContext
# from django.db.models import Count
# import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import json
from DB.funktionenDB import httpOutput
import datetime


def views_annosent(request):
	if 'refresh' in request.GET:
		dauer = adbmodels.tbl_refreshlog_mat_adhocsentences.refresh()
		return httpOutput(json.dumps({'OK': True, 'refreshed': dauer}), 'application/json')
	adavg = datetime.timedelta()
	adavgdg = 0
	for aRl in adbmodels.tbl_refreshlog_mat_adhocsentences.objects.all().order_by('-created_at')[:5]:
		adavg += aRl.duration
		adavgdg += 1
	if adavgdg > 0:
		adavg = adavg / adavgdg
	optionen = {'suche': [{'name': 'sentorig'}, {'name': 'sentorth'}, {'name': 'ttpos'}, {'name': 'sptag'}]}
	return render_to_response('AnnotationsDB/annosent.html', RequestContext(request, {
		'tbl_refreshlog_mat_adhocsentences_last': adbmodels.tbl_refreshlog_mat_adhocsentences.objects.all().order_by('-created_at')[0],
		'tbl_refreshlog_mat_adhocsentences_avg': adavg,
		'optionen': optionen,
		'mat_adhocsentences': adbmodels.mat_adhocsentences.objects.all()[:100]
	}))
