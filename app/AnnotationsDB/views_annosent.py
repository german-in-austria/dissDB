from django.shortcuts import render_to_response
from django.template import RequestContext
from django.db.models import Q
# from django.db.models import Count
# import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import json
from DB.funktionenDB import httpOutput
import datetime


def views_annosent(request):
	# Materialized View Informationen und Aktuallisierung
	if 'getMatViewData' in request.POST:
		if 'refresh' in request.POST and request.POST.get('refresh') == 'true':
			adbmodels.tbl_refreshlog_mat_adhocsentences.refresh()
		adavg = datetime.timedelta()
		adavgdg = 0
		for aRl in adbmodels.tbl_refreshlog_mat_adhocsentences.objects.all().order_by('-created_at')[:5]:
			adavg += aRl.duration
			adavgdg += 1
		if adavgdg > 0:
			adavg = adavg / adavgdg
		return httpOutput(json.dumps({'OK': True, 'mvDurchschnitt': adavg.total_seconds(), 'mvLastUpdate': str(adbmodels.tbl_refreshlog_mat_adhocsentences.objects.all().order_by('-created_at')[0].created_at.strftime("%d.%m.%Y %H:%M:%S"))}, 'application/json'))
	# Basisdaten für Filter laden
	if 'getBaseData' in request.POST:
		return httpOutput(json.dumps({'OK': True}, 'application/json'))
	# Einträge auslesen
	if 'getEntries' in request.POST:
		aSeite = int(request.POST.get('seite'))
		aEps = int(request.POST.get('eps'))
		aFilter = json.loads(request.POST.get('filter'))
		aSuche = json.loads(request.POST.get('suche'))
		aElemente = adbmodels.mat_adhocsentences.objects.all()
		# Suche
		aSucheMuss = []
		aSucheKann = []
		if int(aFilter['trans']) > 0:
			aSucheMuss.append(Q(transid=aFilter['trans']))
		if int(aFilter['inf']) > 0:
			aSucheMuss.append(Q(infid=aFilter['inf']))
		# [{'value': 'zwei', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentorig'}, {'value': '', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentorth'}, {'value': '', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentttpos'}, {'value': '', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentsptag'}]
		for aSuchFeld in aSuche:
			if aSuchFeld['value'].strip():
				aSuchValue = aSuchFeld['value'].strip()
				if 'regex' in aSuchFeld['methode']:
					aTyp = aSuchFeld['methode']
					aSuchValue = r"{0}".format(aSuchValue)
				else:
					aTyp = 'icontains' if aSuchFeld['methode'] == 'ci' else 'contains'
				print(aSuchFeld['methode'], aTyp)
				if aSuchFeld['kannmuss'] == 'muss':
					aSucheMuss.append(Q(**{aSuchFeld['name'] + '__' + aTyp: aSuchValue}))
				if aSuchFeld['kannmuss'] == 'nicht':
					aSucheMuss.append(~Q(**{aSuchFeld['name'] + '__' + aTyp: aSuchValue}))
				if aSuchFeld['kannmuss'] == 'kann':
					aSucheKann.append(Q(**{aSuchFeld['name'] + '__' + aTyp: aSuchValue}))
		if aSucheMuss:
			import operator
			aSucheMussX = aSucheMuss[0]
			for aMuss in aSucheMuss[1:]:
				aSucheMussX = operator.and_(aSucheMussX, aMuss)
		if aSucheKann:
			import operator
			aSucheKannX = aSucheKann[0]
			for aMuss in aSucheKann[1:]:
				aSucheKannX = operator.or_(aSucheKannX, aMuss)
		if aSucheMuss and aSucheKann:
			aElemente = aElemente.filter(aSucheMussX, aSucheKannX)
		elif aSucheMuss:
			aElemente = aElemente.filter(aSucheMussX)
		elif aSucheKann:
			aElemente = aElemente.filter(aSucheKannX)
		aEintraege = [
			{
				'adhoc_sentence': aEintrag.adhoc_sentence,
				'tokenids': aEintrag.tokenids,
				'infid': aEintrag.infid,
				'transid': aEintrag.transid,
				'tokreih': aEintrag.tokreih,
				'seqsent': aEintrag.seqsent,
				'sentorig': aEintrag.sentorig,
				'sentorth': aEintrag.sentorth,
				'left_context': aEintrag.left_context,
				'senttext': aEintrag.senttext,
				'right_context': aEintrag.right_context,
				'sentttlemma': aEintrag.sentttlemma,
				'sentttpos': aEintrag.sentttpos,
				'sentsplemma': aEintrag.sentsplemma,
				'sentsppos': aEintrag.sentsppos,
				'sentsptag': aEintrag.sentsptag,
				'sentspdep': aEintrag.sentspdep,
				'sentspenttype': aEintrag.sentspenttype
			}
			for aEintrag in aElemente[aSeite * aEps:aSeite * aEps + aEps]
		]
		# from django.db import connection
		# print(connection.queries)
		return httpOutput(json.dumps({'OK': True, 'seite': aSeite, 'eps': aEps, 'eintraege': aEintraege, 'zaehler': aElemente.count()}), 'application/json')
	optionen = {'suche': [{'name': 'sentorig'}, {'name': 'sentorth'}, {'name': 'ttpos'}, {'name': 'sptag'}]}
	return render_to_response('AnnotationsDB/annosent.html', RequestContext(request, {
		'tbl_refreshlog_mat_adhocsentences_last': adbmodels.tbl_refreshlog_mat_adhocsentences.objects.all().order_by('-created_at')[0],
		'optionen': optionen,
		'mat_adhocsentences': adbmodels.mat_adhocsentences.objects.all()[:100]
	}))
