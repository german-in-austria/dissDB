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
		sAntworten = json.loads(request.POST.get('antworten'))
		annoSaveAntworten(sAntworten, adbmodels, dbmodels)
	# getTokenSetsSatz
	if 'getTokenSetsSatz' in request.POST:
		aTokenSetsIds = request.POST.getlist('tokenSetsIds[]')
		aTokenSetSatz = {}
		for aTokenSetId in aTokenSetsIds:
			aTokenSet = adbmodels.tbl_tokenset.objects.get(pk=aTokenSetId)
			if aTokenSet.id_von_token and aTokenSet.id_bis_token:
				startToken = aTokenSet.id_von_token
				endToken = aTokenSet.id_bis_token
			else:
				startToken = adbmodels.tbl_tokentoset.objects.filter(id_tokenset=aTokenSet).order_by('id_token__token_reihung')[0].id_token
				endToken = adbmodels.tbl_tokentoset.objects.filter(id_tokenset=aTokenSet).order_by('-id_token__token_reihung')[0].id_token
			with connection.cursor() as cursor:
				cursor.execute('''
					SELECT array_to_json(array_agg(row_to_json(atok)))
					FROM (
						(
							SELECT "token".*, 0 AS tb
							FROM "token"
							WHERE ("token"."ID_Inf_id" = %s AND "token"."transcript_id_id" = %s AND "token"."token_reihung" < %s)
							ORDER BY "token"."token_reihung" DESC
							LIMIT 10
						) UNION ALL (
							SELECT "token".*, 1 AS tb
							FROM "token"
							WHERE ("token"."ID_Inf_id" = %s AND "token"."transcript_id_id" = %s AND "token"."token_reihung" >= %s AND "token"."token_reihung" <= %s)
							ORDER BY "token"."token_reihung" ASC
						) UNION ALL (
							SELECT "token".*, 2 AS tb
							FROM "token"
							WHERE ("token"."ID_Inf_id" = %s AND "token"."transcript_id_id" = %s AND "token"."token_reihung" > %s)
							ORDER BY "token"."token_reihung" ASC
							LIMIT 10
						)
					) AS atok
				''', [
					startToken.ID_Inf_id, startToken.transcript_id_id, startToken.token_reihung,
					startToken.ID_Inf_id, startToken.transcript_id_id, startToken.token_reihung, endToken.token_reihung,
					startToken.ID_Inf_id, startToken.transcript_id_id, endToken.token_reihung
				])
				aTokenSetSatz[aTokenSetId] = cursor.fetchone()[0]
		return httpOutput(json.dumps({'OK': True, 'aTokenSetSatz': aTokenSetSatz}, 'application/json'))
	# getTokenSatz
	if 'getTokenSatz' in request.POST:
		aTokenId = request.POST.get('tokenId')
		aToken = adbmodels.token.objects.get(pk=aTokenId)
		with connection.cursor() as cursor:
			cursor.execute('''
				SELECT array_to_json(array_agg(row_to_json(atok)))
				FROM (
					(
						SELECT "token".*
						FROM "token"
						WHERE ("token"."ID_Inf_id" = %s AND "token"."transcript_id_id" = %s AND "token"."token_reihung" < %s)
						ORDER BY "token"."token_reihung" DESC
						LIMIT 10
					) UNION ALL (
						SELECT "token".*
						FROM "token"
						WHERE ("token"."ID_Inf_id" = %s AND "token"."transcript_id_id" = %s AND "token"."token_reihung" >= %s)
						ORDER BY "token"."token_reihung" ASC
						LIMIT 11
					)
				) AS atok
			''', [aToken.ID_Inf_id, aToken.transcript_id_id, aToken.token_reihung, aToken.ID_Inf_id, aToken.transcript_id_id, aToken.token_reihung])
			aTokenSatz = cursor.fetchone()[0]
		return httpOutput(json.dumps({'OK': True, 'aTokenSatz': aTokenSatz}, 'application/json'))
	# Basisdaten für Filter laden
	if 'getBaseData' in request.POST:
		return httpOutput(json.dumps({'OK': True}, 'application/json'))
	# Einträge auslesen
	if 'getEntries' in request.POST:
		aSeite = int(request.POST.get('seite'))
		aEps = int(request.POST.get('eps'))
		aFilter = json.loads(request.POST.get('filter'))
		aSuche = json.loads(request.POST.get('suche'))
		aSortierung = json.loads(request.POST.get('sortierung'))
		aElemente = adbmodels.mat_adhocsentences.objects.all()
		# Suchen / Filtern
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
		# Sortieren
		aElemente = aElemente.order_by(('-' if not aSortierung['asc'] else '') + aSortierung['spalte'])
		# Einträge ausgeben
		aMatIds = [aEintrag['id'] for aEintrag in aElemente.values('id')[aSeite * aEps:aSeite * aEps + aEps]]
		aEintraege = [
			{
				'adhoc_sentence': aEintrag.adhoc_sentence,
				'tokenids': aEintrag.tokenids,
				'tokens': aEintrag.tokens,
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
			for aEintrag in adbmodels.mat_adhocsentences.objects.raw('''
				SELECT "mat_adhocsentences".*,
					(
						SELECT array_to_json(array_agg(row_to_json(atok)))
						FROM (
							SELECT "token".*,
							(
								SELECT array_to_json(array_agg(row_to_json(aantwort)))
									FROM (
										SELECT "Antworten".*,
										(
											SELECT array_to_json(array_agg(row_to_json(aAntwortenTags)))
												FROM (
													SELECT "AntwortenTags".*
													FROM "AntwortenTags"
													WHERE "AntwortenTags"."id_Antwort_id" = "Antworten"."id"
													ORDER BY "AntwortenTags"."id_TagEbene_id" ASC, "AntwortenTags"."Reihung" ASC
												) AS aAntwortenTags
										) AS AntwortenTags_raw
										FROM "Antworten"
										WHERE "Antworten"."ist_token_id" = "token"."id"
									) AS aantwort
							) AS antworten,
							(
								SELECT array_to_json(array_agg(row_to_json(atokenset)))
									FROM (
											SELECT "tokenset".*,
											(
												SELECT array_to_json(array_agg(row_to_json(aantwort)))
													FROM (
														SELECT "Antworten".*,
														(
															SELECT array_to_json(array_agg(row_to_json(aAntwortenTags)))
																FROM (
																	SELECT "AntwortenTags".*
																	FROM "AntwortenTags"
																	WHERE "AntwortenTags"."id_Antwort_id" = "Antworten"."id"
																	ORDER BY "AntwortenTags"."id_TagEbene_id" ASC, "AntwortenTags"."Reihung" ASC
																) AS aAntwortenTags
														) AS AntwortenTags_raw
														FROM "Antworten"
														WHERE "Antworten"."ist_tokenset_id" = "tokenset"."id"
													) AS aantwort
											) AS antworten,
											(
												SELECT array_to_json(array_agg(row_to_json(atokentoset_cache)))
													FROM (
														SELECT "tokentoset"."id_token_id"
														FROM "tokentoset"
														WHERE "tokentoset"."id_tokenset_id" = "tokenset"."id"
													) AS atokentoset_cache
											) AS tokentoset
												FROM "tokenset"
												LEFT OUTER JOIN "tokentoset" ON ( "tokenset"."id" = "tokentoset"."id_tokenset_id" )
												WHERE "tokentoset"."id_token_id" = "token"."id"
										UNION ALL
											SELECT "tokenset".*,
											(
												SELECT array_to_json(array_agg(row_to_json(aantwort)))
													FROM (
														SELECT "Antworten".*,
														(
															SELECT array_to_json(array_agg(row_to_json(aAntwortenTags)))
																FROM (
																	SELECT "AntwortenTags".*
																	FROM "AntwortenTags"
																	WHERE "AntwortenTags"."id_Antwort_id" = "Antworten"."id"
																	ORDER BY "AntwortenTags"."id_TagEbene_id" ASC, "AntwortenTags"."Reihung" ASC
																) AS aAntwortenTags
														) AS AntwortenTags_raw
														FROM "Antworten"
														WHERE "Antworten"."ist_tokenset_id" = "tokenset"."id"
													) AS aantwort
											) AS antworten,
											(
												SELECT array_to_json(array_agg(row_to_json(atokentoset_cache)))
													FROM (
														SELECT "tokentoset_cache"."id_token_id"
														FROM "tokentoset_cache"
														WHERE "tokentoset_cache"."id_tokenset_id" = "tokenset"."id"
													) AS atokentoset_cache
											) AS tokentoset
												FROM "tokenset"
												LEFT OUTER JOIN "tokentoset_cache" ON ( "tokenset"."id" = "tokentoset_cache"."id_tokenset_id" )
												WHERE "tokentoset_cache"."id_token_id" = "token"."id"
									) AS atokenset
							) AS tokensets
								FROM "token"
								WHERE "token"."id" = ANY("mat_adhocsentences"."tokenids")
								ORDER BY "token"."token_reihung" ASC
						) atok
					) AS "tokens"
				FROM "mat_adhocsentences"
				WHERE "mat_adhocsentences"."id" IN %s
				ORDER BY "mat_adhocsentences"."adhoc_sentence" ASC
			''', [tuple(aMatIds)])]
		# print(connection.queries)
		return httpOutput(json.dumps({'OK': True, 'seite': aSeite, 'eps': aEps, 'eintraege': aEintraege, 'zaehler': aElemente.count()}), 'application/json')
	return render_to_response('AnnotationsDB/annocheck.html', RequestContext(request))
