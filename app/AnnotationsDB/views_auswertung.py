from django.shortcuts import render_to_response, redirect
from django.http import HttpResponse
from django.template import RequestContext
from django.db.models import Count, Q
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import datetime


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
					for aToken in aAntwort.ist_tokenset.tbl_tokentoset_set.all().values('id_token_id').order_by('id_token__token_reihung'):
						aTokens.append(aToken['id_token_id'])
				else:		# ToDo: Optimieren
					for aToken in adbmodels.token.objects.filter(
						ID_Inf_id=aAntwort.ist_tokenset.id_von_token.ID_Inf_id,
						transcript_id=aAntwort.ist_tokenset.id_von_token.transcript_id,
						token_reihung__gte=aAntwort.ist_tokenset.id_von_token.token_reihung,
						token_reihung__lte=aAntwort.ist_tokenset.id_bis_token.token_reihung
					).values('pk').order_by('token_reihung'):
						aTokens.append(aToken['pk'])
			# Transcript
			transName = adbmodels.transcript.objects.filter(token=aTokens[0])[0].name
			aTransId = adbmodels.transcript.objects.filter(token=aTokens[0])[0].pk
			# Sätze erfassen
			[fSatz, fToken, lSatz, lToken, aSaetze, aOrtho] = getSatzFromTokenList(aTokens)
			try:
				[nix, nix, nix, nix, vSatz, nix] = getSatzFromTokenList([adbmodels.token.objects.filter(
					ID_Inf_id=fToken.ID_Inf_id,
					transcript_id=fToken.transcript_id,
					token_reihung__lt=fToken.token_reihung
				).values('pk').order_by('-token_reihung')[0]['pk']])
			except IndexError:
				vSatz = ''
			try:
				[nix, nix, nix, nix, nSatz, nix] = getSatzFromTokenList([adbmodels.token.objects.filter(
					ID_Inf_id=lToken.ID_Inf_id,
					transcript_id=lToken.transcript_id,
					token_reihung__gt=lToken.token_reihung
				).values('pk').order_by('token_reihung')[0]['pk']])
			except IndexError:
				nSatz = ''
			# Datensatz
			aAuswertungen.append({'aNr': aNr, 'fSatzId': str(fSatz.pk), 'lSatzId': str(lSatz.pk), 'aTrans': transName, 'aTransId': aTransId, 'aAntwortId': str(aAntwort.pk), 'aInf': aAntwort.von_Inf.Kuerzel, 'aInfId': aAntwort.von_Inf.pk, 'aTokens': ', '.join(str(x) for x in aTokens), 'aAntTags': aAntTags, 'nAntTags': nAntTags, 'aOrtho': aOrtho, 'aSaetze': aSaetze, 'vSatz': vSatz, 'nSatz': nSatz})
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
			columns.append(('von sId', 2000))
			columns.append(('bis sId', 2000))
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
				ws.write(row_num, 10, int(obj['fSatzId']), font_style)
				ws.write(row_num, 11, int(obj['lSatzId']), font_style)
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


def getSatzFromTokenList(aTokens):
	fSatz = dbmodels.Saetze.objects.filter(token__id=aTokens[0])[0]
	fToken = fSatz.token_set.all().order_by('token_reihung')[0]
	lSatz = dbmodels.Saetze.objects.filter(token__id=aTokens[len(aTokens) - 1])[0]
	lToken = lSatz.token_set.all().order_by('token_reihung')
	lToken = lToken[len(lToken) - 1]
	text = ''
	ortho = ''
	for aToken in adbmodels.token.objects.filter(
		ID_Inf_id=fToken.ID_Inf_id,
		transcript_id=fToken.transcript_id,
		token_reihung__gte=fToken.token_reihung,
		token_reihung__lte=lToken.token_reihung
	).values('text', 'ortho', 'token_type_id_id').order_by('token_reihung'):
		text += (' ' if aToken['token_type_id_id'] != 2 else '') + aToken['text']
		ortho += (' ' if aToken['token_type_id_id'] != 2 else '') + (aToken['ortho'] if aToken['ortho'] else aToken['text'])
	return [fSatz, fToken, lSatz, lToken, text, ortho]
