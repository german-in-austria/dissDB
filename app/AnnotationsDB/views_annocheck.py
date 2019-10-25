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
			ist_token=None,
			ist_tokenset=None
		).distinct().count() if aShowCount else -1})
		aTranskripte.append({'pk': -2, 'name': 'Nur Transkripte', 'count': aAntwortenElement.filter(
			Q(ist_token__gt=0) |
			Q(ist_tokenset__gt=0)
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
		aAntwortenElement = dbmodels.Antworten.objects.all()
		# Suchen / Filtern
		# Einträge laden
		# Einträge ausgeben
		return httpOutput(json.dumps({'OK': True, 'seite': aSeite, 'eps': aEps, 'eintraege': [{'test': 'test'}], 'zaehler': aAntwortenElement.count()}), 'application/json')
		# aElemente = adbmodels.mat_adhocsentences.objects.all()
		# # Suchen / Filtern
		# aSucheMuss = []
		# aSucheKann = []
		# if int(aFilter['trans']) > 0:
		# 	aSucheMuss.append(Q(transid=aFilter['trans']))
		# if int(aFilter['inf']) > 0:
		# 	aSucheMuss.append(Q(infid=aFilter['inf']))
		# # [{'value': 'zwei', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentorig'}, {'value': '', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentorth'}, {'value': '', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentttpos'}, {'value': '', 'kannmuss': 'kann', 'methode': 'ci', 'name': 'sentsptag'}]
		# for aSuchFeld in aSuche:
		# 	if aSuchFeld['value'].strip():
		# 		aSuchValue = aSuchFeld['value'].strip()
		# 		if 'regex' in aSuchFeld['methode']:
		# 			aTyp = aSuchFeld['methode']
		# 			aSuchValue = r"{0}".format(aSuchValue)
		# 		else:
		# 			aTyp = 'icontains' if aSuchFeld['methode'] == 'ci' else 'contains'
		# 		print(aSuchFeld['methode'], aTyp)
		# 		if aSuchFeld['kannmuss'] == 'muss':
		# 			aSucheMuss.append(Q(**{aSuchFeld['name'] + '__' + aTyp: aSuchValue}))
		# 		if aSuchFeld['kannmuss'] == 'nicht':
		# 			aSucheMuss.append(~Q(**{aSuchFeld['name'] + '__' + aTyp: aSuchValue}))
		# 		if aSuchFeld['kannmuss'] == 'kann':
		# 			aSucheKann.append(Q(**{aSuchFeld['name'] + '__' + aTyp: aSuchValue}))
		# if aSucheMuss:
		# 	import operator
		# 	aSucheMussX = aSucheMuss[0]
		# 	for aMuss in aSucheMuss[1:]:
		# 		aSucheMussX = operator.and_(aSucheMussX, aMuss)
		# if aSucheKann:
		# 	import operator
		# 	aSucheKannX = aSucheKann[0]
		# 	for aMuss in aSucheKann[1:]:
		# 		aSucheKannX = operator.or_(aSucheKannX, aMuss)
		# if aSucheMuss and aSucheKann:
		# 	aElemente = aElemente.filter(aSucheMussX, aSucheKannX)
		# elif aSucheMuss:
		# 	aElemente = aElemente.filter(aSucheMussX)
		# elif aSucheKann:
		# 	aElemente = aElemente.filter(aSucheKannX)
		# # Sortieren
		# aElemente = aElemente.order_by(('-' if not aSortierung['asc'] else '') + aSortierung['spalte'])
		# # Einträge ausgeben
		# aMatIds = [aEintrag['id'] for aEintrag in aElemente.values('id')[aSeite * aEps:aSeite * aEps + aEps]]
		# aEintraege = [
		# 	{
		# 		'adhoc_sentence': aEintrag.adhoc_sentence,
		# 		'tokenids': aEintrag.tokenids,
		# 		'tokens': aEintrag.tokens,
		# 		'infid': aEintrag.infid,
		# 		'transid': aEintrag.transid,
		# 		'tokreih': aEintrag.tokreih,
		# 		'seqsent': aEintrag.seqsent,
		# 		'sentorig': aEintrag.sentorig,
		# 		'sentorth': aEintrag.sentorth,
		# 		'left_context': aEintrag.left_context,
		# 		'senttext': aEintrag.senttext,
		# 		'right_context': aEintrag.right_context,
		# 		'sentttlemma': aEintrag.sentttlemma,
		# 		'sentttpos': aEintrag.sentttpos,
		# 		'sentsplemma': aEintrag.sentsplemma,
		# 		'sentsppos': aEintrag.sentsppos,
		# 		'sentsptag': aEintrag.sentsptag,
		# 		'sentspdep': aEintrag.sentspdep,
		# 		'sentspenttype': aEintrag.sentspenttype
		# 	}
		# 	for aEintrag in adbmodels.mat_adhocsentences.objects.raw('''
		# 		SELECT "mat_adhocsentences".*,
		# 			(
		# 				SELECT array_to_json(array_agg(row_to_json(atok)))
		# 				FROM (
		# 					SELECT "token".*,
		# 					(
		# 						SELECT array_to_json(array_agg(row_to_json(aantwort)))
		# 							FROM (
		# 								SELECT "Antworten".*,
		# 								(
		# 									SELECT array_to_json(array_agg(row_to_json(aAntwortenTags)))
		# 										FROM (
		# 											SELECT "AntwortenTags".*
		# 											FROM "AntwortenTags"
		# 											WHERE "AntwortenTags"."id_Antwort_id" = "Antworten"."id"
		# 											ORDER BY "AntwortenTags"."id_TagEbene_id" ASC, "AntwortenTags"."Reihung" ASC
		# 										) AS aAntwortenTags
		# 								) AS AntwortenTags_raw
		# 								FROM "Antworten"
		# 								WHERE "Antworten"."ist_token_id" = "token"."id"
		# 							) AS aantwort
		# 					) AS antworten,
		# 					(
		# 						SELECT array_to_json(array_agg(row_to_json(atokenset)))
		# 							FROM (
		# 									SELECT "tokenset".*,
		# 									(
		# 										SELECT array_to_json(array_agg(row_to_json(aantwort)))
		# 											FROM (
		# 												SELECT "Antworten".*,
		# 												(
		# 													SELECT array_to_json(array_agg(row_to_json(aAntwortenTags)))
		# 														FROM (
		# 															SELECT "AntwortenTags".*
		# 															FROM "AntwortenTags"
		# 															WHERE "AntwortenTags"."id_Antwort_id" = "Antworten"."id"
		# 															ORDER BY "AntwortenTags"."id_TagEbene_id" ASC, "AntwortenTags"."Reihung" ASC
		# 														) AS aAntwortenTags
		# 												) AS AntwortenTags_raw
		# 												FROM "Antworten"
		# 												WHERE "Antworten"."ist_tokenset_id" = "tokenset"."id"
		# 											) AS aantwort
		# 									) AS antworten,
		# 									(
		# 										SELECT array_to_json(array_agg(row_to_json(atokentoset_cache)))
		# 											FROM (
		# 												SELECT "tokentoset"."id_token_id"
		# 												FROM "tokentoset"
		# 												WHERE "tokentoset"."id_tokenset_id" = "tokenset"."id"
		# 											) AS atokentoset_cache
		# 									) AS tokentoset
		# 										FROM "tokenset"
		# 										LEFT OUTER JOIN "tokentoset" ON ( "tokenset"."id" = "tokentoset"."id_tokenset_id" )
		# 										WHERE "tokentoset"."id_token_id" = "token"."id"
		# 								UNION ALL
		# 									SELECT "tokenset".*,
		# 									(
		# 										SELECT array_to_json(array_agg(row_to_json(aantwort)))
		# 											FROM (
		# 												SELECT "Antworten".*,
		# 												(
		# 													SELECT array_to_json(array_agg(row_to_json(aAntwortenTags)))
		# 														FROM (
		# 															SELECT "AntwortenTags".*
		# 															FROM "AntwortenTags"
		# 															WHERE "AntwortenTags"."id_Antwort_id" = "Antworten"."id"
		# 															ORDER BY "AntwortenTags"."id_TagEbene_id" ASC, "AntwortenTags"."Reihung" ASC
		# 														) AS aAntwortenTags
		# 												) AS AntwortenTags_raw
		# 												FROM "Antworten"
		# 												WHERE "Antworten"."ist_tokenset_id" = "tokenset"."id"
		# 											) AS aantwort
		# 									) AS antworten,
		# 									(
		# 										SELECT array_to_json(array_agg(row_to_json(atokentoset_cache)))
		# 											FROM (
		# 												SELECT "tokentoset_cache"."id_token_id"
		# 												FROM "tokentoset_cache"
		# 												WHERE "tokentoset_cache"."id_tokenset_id" = "tokenset"."id"
		# 											) AS atokentoset_cache
		# 									) AS tokentoset
		# 										FROM "tokenset"
		# 										LEFT OUTER JOIN "tokentoset_cache" ON ( "tokenset"."id" = "tokentoset_cache"."id_tokenset_id" )
		# 										WHERE "tokentoset_cache"."id_token_id" = "token"."id"
		# 							) AS atokenset
		# 					) AS tokensets
		# 						FROM "token"
		# 						WHERE "token"."id" = ANY("mat_adhocsentences"."tokenids")
		# 						ORDER BY "token"."token_reihung" ASC
		# 				) atok
		# 			) AS "tokens"
		# 		FROM "mat_adhocsentences"
		# 		WHERE "mat_adhocsentences"."id" IN %s
		# 		ORDER BY "mat_adhocsentences"."adhoc_sentence" ASC
		# 	''', [tuple(aMatIds)])]
		# # print(connection.queries)
		# return httpOutput(json.dumps({'OK': True, 'seite': aSeite, 'eps': aEps, 'eintraege': aEintraege, 'zaehler': aElemente.count()}), 'application/json')
	return render_to_response('AnnotationsDB/annocheck.html', RequestContext(request))
