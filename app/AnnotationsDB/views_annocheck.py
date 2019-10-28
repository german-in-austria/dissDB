from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.template import RequestContext
from django.db.models import Q
from django.db import connection
# from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import json
from DB.funktionenDB import httpOutput
import datetime


def views_annocheck(request):
	# Token Set löschen
	if 'delTokenSet' in request.POST:
		from .funktionenAnno import annoDelTokenSet
		return annoDelTokenSet(int(request.POST.get('tokenSetId')), adbmodels)
	# Token Set Speichern
	if 'saveTokenSet' in request.POST:
		from .funktionenAnno import annoSaveTokenSet
		return annoSaveTokenSet(json.loads(request.POST.get('tokens')), int(request.POST.get('tokenSetId')), adbmodels)
	# Antworten mit Tags speichern/ändern/löschen
	if 'saveAntworten' in request.POST:
		from .funktionenAnno import annoSaveAntworten
		annoSaveAntworten(json.loads(request.POST.get('antworten')), adbmodels, dbmodels)
	# getTokenSetsSatz
	if 'getTokenSetsSatz' in request.POST:
		from .funktionenAnno import getTokenSetsSatz
		return getTokenSetsSatz(request.POST.getlist('tokenSetsIds[]'), adbmodels)
	# getTokenSatz
	if 'getTokenSatz' in request.POST:
		from .funktionenAnno import getTokenSatz
		return getTokenSatz(request.POST.get('tokenId'), adbmodels)
	# Basisdaten für Filter laden
	if 'getBaseData' in request.POST:
		return httpOutput(json.dumps({'OK': True}, 'application/json'))
	# Filter Daten ausgeben
	if 'getFilterData' in request.POST:
		aFilter = json.loads(request.POST.get('filter'))
		aAntwortenElement = dbmodels.Antworten.objects.all()
		aShowCount = True if request.POST.get('showCount') == "true" else False
		showCountTrans = True if aShowCount and request.POST.get('showCountTrans') == "true" else False
		# Tag Ebenen ermitteln
		# ToDo: Antworten Filter hinzufügen
		nTagEbenen = {}
		aTagEbenen = [{'pk': 0, 'title': 'Alle', 'count': aAntwortenElement.count() if aShowCount else -1}]
		for aTE in dbmodels.TagEbene.objects.all():
			nTagEbenen[aTE.pk] = str(aTE)
			aTagEbenen.append({'pk': aTE.pk, 'title': str(aTE), 'count': aAntwortenElement.filter(
				antwortentags__id_TagEbene_id=aTE.pk
			).distinct().count() if aShowCount else -1})
		# Informanten ermitteln
		# ToDo: Antworten Filter hinzufügen
		aInformanten = [{'pk': 0, 'kuerzelAnonym': 'Alle', 'count': aAntwortenElement.count() if aShowCount else -1}]
		for aInf in dbmodels.Informanten.objects.all():
			aInformanten.append({'pk': aInf.pk, 'kuerzelAnonym': aInf.Kuerzel_anonym, 'count': aAntwortenElement.filter(
				von_Inf_id=aInf.pk
			).distinct().count() if aShowCount else -1})
		# Transkripte ermitteln
		# ToDo: Antworten Filter hinzufügen
		aTranskripte = [{'pk': 0, 'name': 'Alle', 'count': aAntwortenElement.count() if aShowCount else -1}]
		aTranskripte.append({'pk': -1, 'name': 'Keine Transkripte', 'count': aAntwortenElement.filter(
			Q(ist_token__gt=0) |
			Q(ist_tokenset__gt=0)
		).distinct().count() if aShowCount else -1})
		aTranskripte.append({'pk': -2, 'name': 'Nur Transkripte', 'count': aAntwortenElement.filter(
			ist_token=None,
			ist_tokenset=None
		).distinct().count() if aShowCount else -1})
		for aTrans in adbmodels.transcript.objects.all():
			aTranskripte.append({'pk': aTrans.pk, 'name': aTrans.name, 'count': aAntwortenElement.filter(
				Q(ist_token__gt=0) |
				Q(ist_tokenset__gt=0),
				Q(ist_token__transcript_id_id=aTrans.pk) |
				Q(ist_tokenset__id_von_token__transcript_id_id=aTrans.pk) |
				Q(ist_tokenset__tbl_tokentoset__id_token__transcript_id_id=aTrans.pk)
			).distinct().count() if aShowCount and showCountTrans else -1})
		return httpOutput(json.dumps({'OK': True, 'tagEbenen': aTagEbenen, 'informanten': aInformanten, 'transcripts': aTranskripte}), 'application/json')
	# Einträge auslesen
	if 'getEntries' in request.POST:
		aSeite = int(request.POST.get('seite')) if request.POST.get('seite') else 0
		aEps = int(request.POST.get('eps')) if request.POST.get('eps') else 0
		aFilter = json.loads(request.POST.get('filter'))
		aSuche = json.loads(request.POST.get('suche')) if request.POST.get('suche') else []
		aSortierung = json.loads(request.POST.get('sortierung')) if request.POST.get('sortierung') else []
		aElemente = dbmodels.Antworten.objects.distinct().all()
		# Suchen / Filtern
		aSucheMuss = []
		aSucheKann = []
		if int(aFilter['ebene']) > 0:
			aSucheMuss.append(Q(antwortentags__id_TagEbene_id=aFilter['ebene']))
		if int(aFilter['trans']) == -1:
			aSucheMuss.append(Q(ist_token__gt=0) | Q(ist_tokenset__gt=0))
		elif int(aFilter['trans']) == -2:
			aSucheMuss.append(Q(ist_token=None))
			aSucheMuss.append(Q(ist_tokenset=None))
		elif int(aFilter['trans']) > 0:
			aSucheMuss.append(Q(ist_token__gt=0) | Q(ist_tokenset__gt=0))
			aSucheMuss.append(
				Q(ist_token__transcript_id_id=aFilter['trans']) |
				Q(ist_tokenset__id_von_token__transcript_id_id=aFilter['trans']) |
				Q(ist_tokenset__tbl_tokentoset__id_token__transcript_id_id=aFilter['trans'])
			)
		if int(aFilter['inf']) > 0:
			aSucheMuss.append(Q(von_Inf_id=aFilter['inf']))
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
		# Sortieren
		aElemente = aElemente.order_by(('-' if not aSortierung['asc'] else '') + aSortierung['spalte'])
		# Einträge laden
		aEintraege = []
		for aEintrag in aElemente[aSeite * aEps:aSeite * aEps + aEps]:
			aEintraege.append({
				'antId': aEintrag.id,
				'Reihung': aEintrag.Reihung
			})
		# Einträge ausgeben
		return httpOutput(json.dumps({'OK': True, 'seite': aSeite, 'eps': aEps, 'eintraege': aEintraege, 'zaehler': aElemente.count()}), 'application/json')
	return render_to_response('AnnotationsDB/annocheck.html', RequestContext(request))
