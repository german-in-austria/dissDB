from django.shortcuts import render_to_response
from django.template import RequestContext
# from django.db.models import Count
# import Datenbank.models as dbmodels
# import AnnotationsDB.models as adbmodels
# import json
# from DB.funktionenDB import httpOutput
# import operator
# from copy import deepcopy
# import datetime


def views_annosent(request):
	return render_to_response('AnnotationsDB/annosent.html', RequestContext(request))
