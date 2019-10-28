"""Anno-Check Tool."""
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.db.models import Q
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import json
from DB.funktionenDB import httpOutput


def views_annocheck(request):
	"""Anno-Check Tool Ansicht/Daten."""
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
		aAntwortenElementF = filternSuchen(aAntwortenElement, 0, int(aFilter['trans']), int(aFilter['inf']))
		nTagEbenen = {}
		aTagEbenen = [{'pk': 0, 'title': 'Alle', 'count': aAntwortenElementF.distinct().count() if aShowCount else -1}]
		for aTE in dbmodels.TagEbene.objects.all():
			nTagEbenen[aTE.pk] = str(aTE)
			aTagEbenen.append({'pk': aTE.pk, 'title': str(aTE), 'count': aAntwortenElementF.filter(
				antwortentags__id_TagEbene_id=aTE.pk
			).distinct().count() if aShowCount else -1})
		# Informanten ermitteln
		aAntwortenElementF = filternSuchen(aAntwortenElement, int(aFilter['ebene']), int(aFilter['trans']), 0)
		aInformanten = [{'pk': 0, 'kuerzelAnonym': 'Alle', 'count': aAntwortenElementF.distinct().count() if aShowCount else -1}]
		for aInf in dbmodels.Informanten.objects.all():
			aInformanten.append({'pk': aInf.pk, 'kuerzelAnonym': aInf.Kuerzel_anonym, 'count': aAntwortenElementF.filter(
				von_Inf_id=aInf.pk
			).distinct().count() if aShowCount else -1})
		# Transkripte ermitteln
		aAntwortenElementF = filternSuchen(aAntwortenElement, int(aFilter['ebene']), 0, int(aFilter['inf']))
		aTranskripte = [{'pk': 0, 'name': 'Alle', 'count': aAntwortenElementF.distinct().count() if aShowCount else -1}]
		aTranskripte.append({'pk': -1, 'name': 'Keine Transkripte', 'count': aAntwortenElementF.filter(
			Q(ist_token__gt=0) |
			Q(ist_tokenset__gt=0)
		).distinct().count() if aShowCount else -1})
		aTranskripte.append({'pk': -2, 'name': 'Nur Transkripte', 'count': aAntwortenElementF.filter(
			ist_token=None,
			ist_tokenset=None
		).distinct().count() if aShowCount else -1})
		for aTrans in adbmodels.transcript.objects.all():
			aTranskripte.append({'pk': aTrans.pk, 'name': aTrans.name, 'count': aAntwortenElementF.filter(
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
		# aSuche = json.loads(request.POST.get('suche')) if request.POST.get('suche') else []
		aSortierung = json.loads(request.POST.get('sortierung')) if request.POST.get('sortierung') else []
		aElemente = dbmodels.Antworten.objects.distinct().all()
		# Suchen / Filtern
		aElemente = filternSuchen(aElemente, int(aFilter['ebene']), int(aFilter['trans']), int(aFilter['inf']))
		# Sortieren
		aElemente = aElemente.order_by(('-' if not aSortierung['asc'] else '') + aSortierung['spalte'])
		# Einträge laden
		aEintraege = []
		for aEintrag in aElemente[aSeite * aEps:aSeite * aEps + aEps]:
			aEintraege.append({
				'id': aEintrag.id,
				'Reihung': aEintrag.Reihung,
				'zu_Aufgabe_id': aEintrag.zu_Aufgabe_id,
				'aufBe': aEintrag.zu_Aufgabe.Beschreibung_Aufgabe if aEintrag.zu_Aufgabe_id else None,
				'aufVar': aEintrag.zu_Aufgabe.Variante if aEintrag.zu_Aufgabe_id else None,
				'aInf': aEintrag.von_Inf.Kuerzel,
				'von_Inf_id': aEintrag.von_Inf_id
			})
		# Einträge ausgeben
		return httpOutput(json.dumps({'OK': True, 'seite': aSeite, 'eps': aEps, 'eintraege': aEintraege, 'zaehler': aElemente.count()}), 'application/json')
	return render_to_response('AnnotationsDB/annocheck.html', RequestContext(request))


def filternSuchen(aElemente, fEbene, fTrans, fInf):
	"""Filtern und Suchen."""
	aSucheMuss = []
	aSucheKann = []
	if fEbene > 0:
		aSucheMuss.append(Q(antwortentags__id_TagEbene_id=fEbene))
	if fTrans == -1:
		aSucheMuss.append(Q(ist_token__gt=0) | Q(ist_tokenset__gt=0))
	elif fTrans == -2:
		aSucheMuss.append(Q(ist_token=None))
		aSucheMuss.append(Q(ist_tokenset=None))
	elif fTrans > 0:
		aSucheMuss.append(Q(ist_token__gt=0) | Q(ist_tokenset__gt=0))
		aSucheMuss.append(
			Q(ist_token__transcript_id_id=fTrans) |
			Q(ist_tokenset__id_von_token__transcript_id_id=fTrans) |
			Q(ist_tokenset__tbl_tokentoset__id_token__transcript_id_id=fTrans)
		)
	if fInf > 0:
		aSucheMuss.append(Q(von_Inf_id=fInf))
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
	return aElemente
