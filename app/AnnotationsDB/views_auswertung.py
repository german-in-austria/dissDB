from django.shortcuts import render_to_response, redirect
from django.http import HttpResponse
from django.template import RequestContext
from django.db import connection
from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import datetime
import time
from .funktionenAnno import getSatzFromTokenList


def views_auswertung(request, aTagEbene, aSeite):
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	getXls = False
	if 'get' in request.GET and request.GET.get('get') == 'xls':
		getXls = True
	maxVars = 500
	nTagEbenen = {}
	aTagEbene = int(aTagEbene)
	aSeite = int(aSeite)
	aTagEbenen = []
	for aTE in dbmodels.TagEbene.objects.all():
		nTagEbenen[aTE.pk] = str(aTE)
		aTagEbenen.append({'pk': aTE.pk, 'title': str(aTE), 'count': dbmodels.Antworten.objects.filter(
			antwortentags__id_TagEbene_id=aTE.pk).distinct().count()}
		)
	aAuswertungen = []
	aAntTagsTitle = None
	nAntTagsTitle = None
	prev = -1
	next = -1
	aCount = 0
	if aTagEbene > 0:
		maxPerPage = 15
		# Tags
		nTags = {x.pk: x.Tag for x in dbmodels.Tags.objects.all()}
		# Antworten
		aAntwortenM = dbmodels.Antworten.objects.filter(
			antwortentags__id_TagEbene_id=aTagEbene
		).distinct()
		aCount = aAntwortenM.count()
		# Seiten
		if aSeite > 0:
			prev = aSeite - 1
		if aCount > (aSeite + 1) * maxPerPage:
			next = aSeite + 1
		# Antworten ... weiter
		aAntTagsTitle = nTagEbenen[aTagEbene]
		nAntTagsTitle = []
		aNr = aSeite * maxPerPage
		# start = time.time()
		for aAntwort in aAntwortenM if getXls else aAntwortenM[aSeite * maxPerPage:aSeite * maxPerPage + maxPerPage]:
			aNr += 1
			# Tag Ebene mit Tags
			# tetstart = time.time()
			nAntTags = {}
			aAntTags = None
			for xval in dbmodels.AntwortenTags.objects.filter(id_Antwort=aAntwort.pk).values('id_TagEbene').annotate(total=Count('id_TagEbene')).order_by('id_TagEbene'):
				xDat = {'e': {'t': nTagEbenen[xval['id_TagEbene']], 'i': xval['id_TagEbene']}, 't': ', '.join([nTags[x['id_Tag_id']] for x in dbmodels.AntwortenTags.objects.filter(id_Antwort=aAntwort.pk, id_TagEbene=xval['id_TagEbene']).values('id_Tag_id').order_by('Reihung')])}
				if xval['id_TagEbene'] == aTagEbene:
					aAntTags = xDat
				else:
					nAntTags[xDat['e']['i']] = xDat
					if xDat['e'] not in nAntTagsTitle:
						nAntTagsTitle.append(xDat['e'])
			# print('Tag Ebene mit Tags', time.time() - tetstart)  # 0.00 Sek
			# Tokens
			aTokens = []
			aTokensText = []
			aTokensOrtho = []
			aAntwortType = None		# t = Token, b = Bereich (TokenSet), l = Liste (TokenSet), s = Satz (Kein Transkript)
			if aAntwort.ist_token:
				aTokens.append(aAntwort.ist_token_id)
				aTokensText.append(aAntwort.ist_token.text)
				aTokensOrtho.append(aAntwort.ist_token.ortho)
				aAntwortType = 't'
			if aAntwort.ist_tokenset:
				# xStart = time.time()
				with connection.cursor() as cursor:
					cursor.execute('''
						SELECT (
							CASE
								WHEN ts.id_von_token_id > 0 THEN
									'b'
								ELSE
									'l'
							END
						) as tokenset_type,
						(
							CASE
								WHEN ts.id_von_token_id > 0 THEN
									(
										SELECT
											ARRAY_AGG(json_build_array(at.id, at.text, (CASE WHEN at.ortho IS NOT NULL THEN at.ortho ELSE at.text END)))
										FROM (
											SELECT t.id, t.text, t.ortho
											FROM token t
											LEFT JOIN LATERAL (
												SELECT vt.token_reihung, vt."ID_Inf_id", vt.transcript_id_id
												FROM token vt
												WHERE
													vt.id = ts.id_von_token_id
												ORDER BY vt.token_reihung DESC LIMIT 1
											) vtr ON true
											LEFT JOIN LATERAL (
												SELECT bt.token_reihung
												FROM token bt
												WHERE
													bt.id = ts.id_bis_token_id
												ORDER BY bt.token_reihung DESC LIMIT 1
											) btr ON true
											WHERE
												t.token_reihung >= vtr.token_reihung AND
												t.token_reihung <= btr.token_reihung AND
												t."ID_Inf_id" = vtr."ID_Inf_id" AND
												t.transcript_id_id = vtr.transcript_id_id
											ORDER BY t.token_reihung ASC
										) as at
									)
								ELSE
									(
										SELECT
											ARRAY_AGG(json_build_array(at.id, at.text, (CASE WHEN at.ortho IS NOT NULL THEN at.ortho ELSE at.text END)))
										FROM (
											SELECT t.id, t.text, t.ortho
											FROM token t
											LEFT JOIN tokentoset tts ON tts.id_tokenset_id = ts.id
											WHERE t.id = tts.id_token_id
											ORDER BY t.token_reihung ASC
										) as at
									)
							END
						) as tokens
						FROM tokenset ts
						WHERE ts.id = %s
					''', [aAntwort.ist_tokenset_id])
					[aAntwortType, ts_tokens] = cursor.fetchone()
					for aToken in ts_tokens:
						aTokens.append(aToken[0])
						aTokensText.append(aToken[1])
						aTokensOrtho.append(aToken[2])
				# print('Tokenset - Raw  ', aAntwort.ist_tokenset_id, time.time() - xStart)  # 0.015 Sek
			[aSaetze, aOrtho, prev_text, vSatz, next_text, nSatz, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id] = [None, None, None, None, None, None, None, None, None, None, None, None, None]
			if aTokens:
				# Transcript
				transName = adbmodels.transcript.objects.filter(token=aTokens[0])[0].name
				aTransId = adbmodels.transcript.objects.filter(token=aTokens[0])[0].pk
				# Sätze erfassen
				[aSaetze, aOrtho, prev_text, vSatz, next_text, nSatz, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id] = getSatzFromTokenList(aTokens)
			else:
				transName = None
				aTransId = None
				aAntwortType = 's'
				aSaetze = aAntwort.ist_Satz.Transkript if aAntwort.ist_Satz.Transkript else aAntwort.ist_Satz.Standardorth
				aOrtho = aAntwort.ist_Satz.Standardorth if aAntwort.ist_Satz.Standardorth else aAntwort.ist_Satz.Transkript
			# Datensatz
			aAuswertungen.append({
				'aNr': aNr,
				'aTrans': transName,
				'aTransId': aTransId,
				'aAntwortId': str(aAntwort.pk),
				'aAntwortType': aAntwortType,
				'aAufgabeId': aAntwort.zu_Aufgabe_id,
				'aAufgabeBeschreibung': aAntwort.zu_Aufgabe.Beschreibung_Aufgabe if aAntwort.zu_Aufgabe_id else None,
				'aAufgabeVariante': aAntwort.zu_Aufgabe.Variante if aAntwort.zu_Aufgabe_id else None,
				'aInf': aAntwort.von_Inf.Kuerzel,
				'aInfId': aAntwort.von_Inf.pk,
				'aTokensText': ' '.join(str(x) for x in aTokensText),
				'aTokens': ', '.join(str(x) for x in aTokens),
				'aAntTags': aAntTags,
				'nAntTags': nAntTags,
				'aOrtho': aOrtho,
				'aSaetze': aSaetze,
				'vSatz': vSatz,
				'nSatz': nSatz
			})
		# print('aAuswertungen', time.time() - start)  # 1,7 Sekunden -> 1,1 Sekunden
		if getXls:
			import xlwt
			response = HttpResponse(content_type='text/ms-excel')
			response['Content-Disposition'] = 'attachment; filename="tagebene_' + str(aTagEbene) + '_' + datetime.date.today().strftime('%Y%m%d') + '.xls"'
			wb = xlwt.Workbook(encoding='utf-8')
			ws = wb.add_sheet(aAntTagsTitle)
			row_num = 0
			columns = []
			columns.append(('Nr', 2000))
			columns.append(('Transkript', 2000))
			columns.append(('tId', 2000))
			columns.append(('Informant', 2000))
			columns.append(('iId', 2000))
			columns.append(('antId', 2000))
			columns.append(('antType', 2000))
			columns.append(('aufId', 2000))
			columns.append(('aufBe', 2000))
			columns.append(('aufVar', 2000))
			columns.append(('vorheriger Satz', 2000))
			columns.append(('Sätze', 2000))
			columns.append(('nächster Satz', 2000))
			columns.append(('Sätze in Ortho', 2000))
			columns.append(('Ausgewählte Tokens', 2000))
			columns.append(('Ausgewählte Tokens (Id)', 2000))
			columns.append((aAntTagsTitle, 2000))
			for nATT in nAntTagsTitle:
				columns.append((nATT['t'], 2000))
			font_style = xlwt.XFStyle()
			font_style.font.bold = True
			for col_num in range(len(columns)):
				ws.write(row_num, col_num, columns[col_num][0], font_style)
			font_style = xlwt.XFStyle()
			for obj in aAuswertungen:
				row_num += 1
				ws.write(row_num, 0, obj['aNr'], font_style)
				ws.write(row_num, 1, obj['aTrans'], font_style)
				ws.write(row_num, 2, obj['aTransId'], font_style)
				ws.write(row_num, 3, obj['aInf'], font_style)
				ws.write(row_num, 4, obj['aInfId'], font_style)
				ws.write(row_num, 5, int(obj['aAntwortId']), font_style)
				ws.write(row_num, 6, obj['aAntwortType'], font_style)
				ws.write(row_num, 7, int(obj['aAufgabeId']), font_style)
				ws.write(row_num, 8, obj['aAufgabeBeschreibung'], font_style)
				ws.write(row_num, 9, int(obj['aAufgabeVariante']), font_style)
				ws.write(row_num, 10, obj['vSatz'], font_style)
				ws.write(row_num, 11, obj['aSaetze'], font_style)
				ws.write(row_num, 12, obj['nSatz'], font_style)
				ws.write(row_num, 13, obj['aOrtho'], font_style)
				ws.write(row_num, 14, obj['aTokensText'], font_style)
				ws.write(row_num, 15, obj['aTokens'], font_style)
				if obj['aAntTags']:
					ws.write(row_num, 16, obj['aAntTags']['t'], font_style)
				dg = 0
				for nATT in nAntTagsTitle:
					if nATT['i'] in obj['nAntTags']:
						ws.write(row_num, 17 + dg, obj['nAntTags'][nATT['i']]['t'], font_style)
					dg += 1
			wb.save(response)
			return response
	return render_to_response('AnnotationsDB/auswertungstart.html', RequestContext(request, {'aTagEbene': aTagEbene, 'prev': prev, 'next': next, 'tagEbenen': aTagEbenen, 'aAuswertungen': aAuswertungen, 'aAntTagsTitle': aAntTagsTitle, 'nAntTagsTitle': nAntTagsTitle, 'aCount': aCount}))
