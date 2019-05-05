from django.shortcuts import render_to_response
from django.template import RequestContext
# from django.db.models import Count
# import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import json
from DB.funktionenDB import httpOutput
# import datetime


def views_annosent(request):
	if 'refresh' in request.GET:
		dauer = adbmodels.tbl_refreshlog_mat_adhocsentences.refresh()
		return httpOutput(json.dumps({'OK': True, 'refreshed': dauer}), 'application/json')
	return render_to_response('AnnotationsDB/annosent.html', RequestContext(request, {
		'tbl_refreshlog_mat_adhocsentences': adbmodels.tbl_refreshlog_mat_adhocsentences.objects.all().order_by('-created_at'),
		'mat_adhocsentences': adbmodels.mat_adhocsentences.objects.all()[:20]
	}))
