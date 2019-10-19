from django.shortcuts import render_to_response, redirect
from django.http import HttpResponse
from django.template import RequestContext
from django.db import connection
from django.db.models import Count, Q
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import datetime
import time


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
			Q(ist_token__isnull=False) | Q(ist_tokenset__isnull=False),
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
			Q(ist_token__isnull=False) | Q(ist_tokenset__isnull=False),
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
			# Tokens
			aTokens = []
			if aAntwort.ist_token:
				aTokens.append(aAntwort.ist_token_id)
			if aAntwort.ist_tokenset:
				if aAntwort.ist_tokenset.id_von_token is None:		# ToDo: Optimieren
					# xStart = time.time()
					for aToken in aAntwort.ist_tokenset.tbl_tokentoset_set.all().values('id_token_id').order_by('id_token__token_reihung'):
						aTokens.append(aToken['id_token_id'])
					# print('Tokenset - Bereich', time.time() - xStart)
				else:		# ToDo: Optimieren
					# xStart = time.time()
					for aToken in adbmodels.token.objects.filter(
						ID_Inf_id=aAntwort.ist_tokenset.id_von_token.ID_Inf_id,
						transcript_id=aAntwort.ist_tokenset.id_von_token.transcript_id,
						token_reihung__gte=aAntwort.ist_tokenset.id_von_token.token_reihung,
						token_reihung__lte=aAntwort.ist_tokenset.id_bis_token.token_reihung
					).values('pk').order_by('token_reihung'):
						aTokens.append(aToken['pk'])
					# print('Tokenset - Liste', time.time() - xStart)  # 0.015 Sek
			# Transcript
			transName = adbmodels.transcript.objects.filter(token=aTokens[0])[0].name
			aTransId = adbmodels.transcript.objects.filter(token=aTokens[0])[0].pk
			# Sätze erfassen
			[aSaetze, aOrtho, prev_text, vSatz, next_text, nSatz, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id] = getSatzFromTokenList(aTokens)
			# Datensatz
			aAuswertungen.append({'aNr': aNr, 'aTrans': transName, 'aTransId': aTransId, 'aAntwortId': str(aAntwort.pk), 'aInf': aAntwort.von_Inf.Kuerzel, 'aInfId': aAntwort.von_Inf.pk, 'aTokens': ', '.join(str(x) for x in aTokens), 'aAntTags': aAntTags, 'nAntTags': nAntTags, 'aOrtho': aOrtho, 'aSaetze': aSaetze, 'vSatz': vSatz, 'nSatz': nSatz})
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
			columns.append(('aId', 2000))
			columns.append(('vorheriger Satz', 2000))
			columns.append(('Sätze', 2000))
			columns.append(('nächster Satz', 2000))
			columns.append(('Sätze in Ortho', 2000))
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
				ws.write(row_num, 6, obj['vSatz'], font_style)
				ws.write(row_num, 7, obj['aSaetze'], font_style)
				ws.write(row_num, 8, obj['nSatz'], font_style)
				ws.write(row_num, 9, obj['aOrtho'], font_style)
				ws.write(row_num, 12, obj['aTokens'], font_style)
				if obj['aAntTags']:
					ws.write(row_num, 13, obj['aAntTags']['t'], font_style)
				dg = 0
				for nATT in nAntTagsTitle:
					if nATT['i'] in obj['nAntTags']:
						ws.write(row_num, 14 + dg, obj['nAntTags'][nATT['i']]['t'], font_style)
					dg += 1
			wb.save(response)
			return response
	return render_to_response('AnnotationsDB/auswertungstart.html', RequestContext(request, {'aTagEbene': aTagEbene, 'prev': prev, 'next': next, 'tagEbenen': aTagEbenen, 'aAuswertungen': aAuswertungen, 'aAntTagsTitle': aAntTagsTitle, 'nAntTagsTitle': nAntTagsTitle, 'aCount': aCount}))


def getSatzFromTokenList(aTokens, justText=False):
	# start = time.time()
	with connection.cursor() as cursor:
		cursor.execute('''
			WITH o_f_token AS (
				SELECT
					t.token_reihung as o_f_token_reihung,
					x.token_reihung as o_f_prev_token_reihung,
					x.token_type_id_id as o_f_prev_token_type,
					t."ID_Inf_id" as informanten_id,
					t.transcript_id_id as transcript_id
				FROM token t
				LEFT JOIN LATERAL (
					SELECT p.token_type_id_id, p.token_reihung
					FROM token p
					WHERE
						p.token_reihung < t.token_reihung AND
						p."ID_Inf_id" = t."ID_Inf_id" AND
						p.transcript_id_id = t.transcript_id_id
					ORDER BY p.token_reihung DESC LIMIT 1
				) x ON true
				WHERE t.id = %s
			), r_f_token AS (
				SELECT
					t.token_reihung as r_f_token_reihung
				FROM token t, o_f_token oft
				WHERE
					t.token_reihung <= oft.o_f_token_reihung AND
					t."ID_Inf_id" = oft.informanten_id AND
					t.transcript_id_id = oft.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung DESC LIMIT 1
			), o_l_token AS (
				SELECT
					t.token_reihung as o_l_token_reihung,
					t.token_type_id_id as o_l_token_type
				FROM token t
				WHERE id = %s
			), r_l_token AS (
				SELECT
					t.token_reihung as r_l_token_reihung
				FROM token t, o_f_token oft, o_l_token olt
				WHERE
					t.token_reihung > olt.o_l_token_reihung AND
					t."ID_Inf_id" = oft.informanten_id AND
					t.transcript_id_id = oft.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung ASC LIMIT 1
			), base_data AS (
				SELECT
					o_f_token.o_f_token_reihung,
					(CASE
						WHEN o_f_token.o_f_prev_token_type = 2 THEN
							o_f_token.o_f_prev_token_reihung
						ELSE (
							SELECT r_f_token.r_f_token_reihung FROM r_f_token
						)
					END) as r_f_token_reihung,
					o_l_token.o_l_token_reihung,
					(CASE
						WHEN o_l_token.o_l_token_type = 2 THEN
							o_l_token.o_l_token_reihung
						ELSE (
							SELECT r_l_token.r_l_token_reihung FROM r_l_token
						)
					END) as r_l_token_reihung,
					o_l_token.o_l_token_type,
					o_f_token.transcript_id,
					o_f_token.informanten_id
				FROM o_l_token, o_f_token
			), text_data AS (
				SELECT
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || td.text, '') AS text,
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || (CASE WHEN td.ortho IS NOT NULL THEN td.ortho ELSE td.text END), '') AS orthotext
				FROM (
					SELECT *
					FROM token ttd, base_data bd
					WHERE
						ttd.token_reihung > bd.r_f_token_reihung AND
						ttd.token_reihung <= bd.r_l_token_reihung AND
						ttd."ID_Inf_id" = bd.informanten_id AND
						ttd.transcript_id_id = bd.transcript_id
					ORDER BY ttd.token_reihung ASC
				) as td
			), p_f_token AS (
				SELECT
					t.token_reihung as p_f_token_reihung
				FROM token t, base_data bd
				WHERE
					t.token_reihung < bd.r_f_token_reihung AND
					t."ID_Inf_id" = bd.informanten_id AND
					t.transcript_id_id = bd.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung DESC LIMIT 1
			), prev_text_data AS (
				SELECT
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || td.text, '') AS prev_text,
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || (CASE WHEN td.ortho IS NOT NULL THEN td.ortho ELSE td.text END), '') AS prev_orthotext
				FROM (
					SELECT *
					FROM token ttd, base_data bd, p_f_token
					WHERE
						ttd.token_reihung <= bd.r_f_token_reihung AND
						ttd.token_reihung > p_f_token.p_f_token_reihung AND
						ttd."ID_Inf_id" = bd.informanten_id AND
						ttd.transcript_id_id = bd.transcript_id
					ORDER BY ttd.token_reihung ASC
				) as td
			), n_l_token AS (
				SELECT
					t.token_reihung as n_l_token_reihung
				FROM token t, base_data bd
				WHERE
					t.token_reihung > bd.r_l_token_reihung AND
					t."ID_Inf_id" = bd.informanten_id AND
					t.transcript_id_id = bd.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung ASC LIMIT 1
			), next_text_data AS (
				SELECT
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || td.text, '') AS next_text,
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || (CASE WHEN td.ortho IS NOT NULL THEN td.ortho ELSE td.text END), '') AS next_orthotext
				FROM (
					SELECT *
					FROM token ttd, base_data bd, n_l_token
					WHERE
						ttd.token_reihung > bd.r_l_token_reihung AND
						ttd.token_reihung <= n_l_token.n_l_token_reihung AND
						ttd."ID_Inf_id" = bd.informanten_id AND
						ttd.transcript_id_id = bd.transcript_id
					ORDER BY ttd.token_reihung ASC
				) as td
			)

			SELECT
				td.*,
				ptd.*,
				ntd.*,
				bd.*
			FROM base_data bd, text_data td, prev_text_data ptd, next_text_data ntd
		''', [aTokens[0], aTokens[len(aTokens) - 1]])
		[a_text, a_orthotext, prev_text, prev_orthotext, next_text, next_orthotext, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id] = cursor.fetchone()
	# print(aTokens[0], aTokens[len(aTokens) - 1], ' -> ', [a_text, a_orthotext, prev_text, prev_orthotext, next_text, next_orthotext, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id])
	# print('getSatzFromTokenList', time.time() - start)  # 0.02 Sek * 3 -> 0.045 Sek * 1
	return [a_text, a_orthotext, prev_text, prev_orthotext, next_text, next_orthotext, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id]
