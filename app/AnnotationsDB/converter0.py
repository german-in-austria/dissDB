from django.shortcuts import render_to_response, redirect
import json
from DB.funktionenDB import httpOutput
from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
from django.db.models import Q
from django.db import connection
import datetime
import math
from django.db import transaction


def view(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	output = '<!doctype html><meta charset="utf-8"><html><body><div style="max-width:1800px;margin:10px auto;">'
	with open('AnnotationsDB/converter0.json', 'r', encoding='utf8') as file:
		aData = json.load(file)
	rows = ['DBresult', 'idtagebene', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
	doIt = 'doit' in request.GET
	maxPerSite = 25
	aSite = int(request.GET.get('site')) if 'site' in request.GET else 0
	maxSites = math.ceil(len(aData) / maxPerSite)
	output += '<div>' + str(aSite + 1) + '/' + str(maxSites) + '</div><div>'
	if aSite > 0:
		output += '<a href="/annotationsdb/converter0?site=' + str(aSite - 1) + '">Zurück</a>'
		if aSite < maxSites - 1:
			output += ' - '
	if aSite < maxSites - 1:
		output += '<a href="/annotationsdb/converter0?site=' + str(aSite + 1) + '">Weiter</a>'
	output += '</div>'
	output += '<div><p><a href="/annotationsdb/converter0?site=' + str(aSite) + '&doit=1"><b>Do It</b></a></p></div>'
	count = 0
	for aLine in aData:
		aTokens = adbmodels.token.objects.filter(Q(Q(splemma=aLine['DBresult']) & Q(sptag='NN')) | Q(Q(ttlemma=aLine['DBresult']) & Q(ttpos='NN')) | Q(ortho=aLine['DBresult'])).exclude(ID_Inf_id=35).order_by('token_reihung')
		count += aTokens.count()
	output += '<div>Anzahl: <b>' + str(count) + '</b></div>'
	output += '<table style="white-space:nowrap;"><tr>'
	for row in rows:
		output += '<th align="left">' + row + '</th>'
	output += '<th align="left">Result</th>'
	output += '</tr>'
	alDg = aSite * maxPerSite
	for aLine in aData[aSite * maxPerSite:aSite * maxPerSite + maxPerSite]:
		output += '<tr>'
		for row in rows:
			output += '<td valign="top" style="border-bottom: 1px solid #000;">' + str(aLine[row]) + '</td>'
		# splemma = MATCH und ttpos = "NN" ODER ttlemma = MATCH und ttpos = "NN" ODER ortho = Match
		aTokens = adbmodels.token.objects.filter(Q(Q(splemma=aLine['DBresult']) & Q(sptag='NN')) | Q(Q(ttlemma=aLine['DBresult']) & Q(ttpos='NN')) | Q(ortho=aLine['DBresult'])).exclude(ID_Inf_id=35).order_by('token_reihung')
		# print(aLine['DBresult'], aTokens.count())
		output += '<td valign="top" style="border-bottom: 1px solid #000;">'
		output += '<table style="text-align:right;width:100%;"><tr><th># ' + str(len(aTokens)) + '</th><th>Id</th><th>ttpos</th><th>sptag</th><th>splemma</th><th>ttlemma</th><th>ortho</th><th>Reihung</th><th>Tokens ermittelt</th><th>Tokens verwenden</th><th>Typ</th><th>Tokenset</th><th>Antwort</th><th>Tags</th></tr>'
		dg = 1
		for aToken in aTokens:
			output += '<tr>'
			output += '<td>' + str(dg) + '</td><td>' + str(aToken.id) + '</td><td>' + str(aToken.ttpos) + '</td><td>' + str(aToken.sptag) + '</td><td>' + str(aToken.splemma) + '</td><td>' + str(aToken.ttlemma) + '</td><td>' + str(aToken.ortho) + '</td><td>' + str(aToken.token_reihung) + '</td>'
			# Die zwei Tags davor ermitteln:
			xTokens = None
			with connection.cursor() as cursor:
				cursor.execute('''
					SELECT array_to_json(array_agg(row_to_json(atok)))
					FROM (
						(
							SELECT "token".*, 0 AS tb
							FROM "token"
							WHERE ("token"."ID_Inf_id" = %s AND "token"."transcript_id_id" = %s AND "token"."token_reihung" <= %s)
							ORDER BY "token"."token_reihung" DESC
							LIMIT 5
						)
					) AS atok
				''', [aToken.ID_Inf_id, aToken.transcript_id_id, aToken.token_reihung])
				zTokens = cursor.fetchone()[0]
			xTokens = []
			dg = 0
			for zToken in zTokens:
				if dg < 3:
					xTokens.append(zToken)
				if zToken['token_type_id_id'] == 1:
					dg += 1
			xTokens = reversed(xTokens)
			if xTokens:
				# print(alDg, '/', len(aData), '-', dg, '/', len(aTokens))
				output += '<td>'
				uTokens = []
				dg = 0
				for xToken in xTokens:
					output += (xToken['ortho'] or xToken['text']) + '(' + str(xToken['id']) + ', ' + str(xToken['token_type_id_id']) + ') | '
					if dg > 0 or xToken['token_type_id_id'] == 1:
						uTokens.append(xToken)
					dg += 1
				output += '</td><td>'
				for uToken in uTokens:
					output += (uToken['ortho'] or uToken['text']) + '(' + str(uToken['id']) + ') | '
				output += '</td><td>'
				if len(uTokens) < 1:
					output += '<b style="color:#e00;">Error</b></td><td><b style="color:#e00;">Error</b>'
				elif len(uTokens) == 1:
					output += 'token'
					output += '</td>'
					output += '<td>-</td>'
					aAntworten = dbmodels.Antworten.objects.filter(ist_token_id=uTokens[0]['id'])
					if aAntworten.count() > 0:
						aAntwort = aAntworten[0]
						output += '<td><b style="color:#d00;">Ja</b> (' + str(aAntwort.pk) + ')</td>'
					else:
						if doIt:
							aAntwort = dbmodels.Antworten()
							aAntwort.von_Inf_id = uTokens[0]['ID_Inf_id']
							aAntwort.ist_token_id = uTokens[0]['id']
							aAntwort.start_Antwort = datetime.timedelta(0)
							aAntwort.stop_Antwort = datetime.timedelta(0)
							aAntwort.save()
							output += '<td><b style="color:#0d0;">Nein</b> (' + str(aAntwort.pk) + ')</td>'
						else:
							output += '<td><b style="color:#00d;">Nein</b></td>'
							aAntwort = None
					if aAntwort:
						output += addTags(aAntwort, aLine['idtagebene'], [(aLine[str(x)] if str(x) in aLine else None) for x in range(1, 12)], doIt)
				else:
					output += 'tokenset'
					output += '</td>'
					aTokensets = adbmodels.tbl_tokenset.objects.filter(id_von_token=uTokens[0]['id'], id_bis_token=uTokens[-1]['id']).order_by('created')
					if aTokensets.count() > 0:
						aTokenset = aTokensets[0]
						output += '<td><b style="color:#d00;">Ja</b> (' + str(aTokenset.pk) + ')</td>'
					else:
						if doIt:
							aTokenset = adbmodels.tbl_tokenset()
							aTokenset.id_von_token_id = uTokens[0]['id']
							aTokenset.id_bis_token_id = uTokens[-1]['id']
							aTokenset.save()
							output += '<td><b style="color:#0d0;">Nein</b> (' + str(aTokenset.pk) + ')</td>'
						else:
							output += '<td><b style="color:#00d;">Nein</b></td>'
							aTokenset = None
					if aTokenset:
						aAntworten = dbmodels.Antworten.objects.filter(ist_tokenset_id=aTokenset.pk)
						if aAntworten.count() > 0:
							aAntwort = aAntworten[0]
							output += '<td><b style="color:#d00;">Ja</b> (' + str(aAntwort.pk) + ')</td>'
						else:
							if doIt:
								aAntwort = dbmodels.Antworten()
								aAntwort.von_Inf_id = uTokens[0]['ID_Inf_id']
								aAntwort.ist_tokenset_id = aTokenset.pk
								aAntwort.start_Antwort = datetime.timedelta(0)
								aAntwort.stop_Antwort = datetime.timedelta(0)
								aAntwort.save()
								output += '<td><b style="color:#0d0;">Nein</b> (' + str(aAntwort.pk) + ')</td>'
							else:
								output += '<td><b style="color:#00d;">Nein</b></td>'
								aAntwort = None
						if aAntwort:
							output += addTags(aAntwort, aLine['idtagebene'], [(aLine[str(x)] if str(x) in aLine else None) for x in range(1, 12)], doIt)
			output += '</tr>'
			dg += 1
		output += '</table>'
		output += '</td>'
		output += '</tr>'
		alDg += 1
	output += '</table>'
	return httpOutput(output + '</div></body></html>', 'text/html')


def addTags(aAntwort, aEbenenId, aTagIDs, doIt):
	output = ''
	# print(aAntwort, aEbenenId, aTagIDs)
	aAntwortenTags = dbmodels.AntwortenTags.objects.filter(id_Antwort_id=aAntwort.pk)
	if aAntwortenTags.filter(id_TagEbene=aEbenenId).count() == 0:
		aReihung = 0
		if aAntwortenTags.count() > 0:
			aReihung = aAntwortenTags.last().Reihung
			aReihung = (aReihung + 1) if aReihung else 0
		dg = 0
		if doIt:
			with transaction.atomic():
				for aTagId in aTagIDs:
					if aTagId:
						# print(aReihung, aTagId)
						aAntwortenTag = dbmodels.AntwortenTags()
						aAntwortenTag.id_Antwort_id = aAntwort.pk
						aAntwortenTag.id_Tag_id = aTagId
						aAntwortenTag.id_TagEbene_id = aEbenenId
						aAntwortenTag.Reihung = aReihung
						aAntwortenTag.save()
						aReihung += 1
						dg += 1
			output += '<td><b style="color:#0d0;">' + str(dg) + ' AntwortenTags hinzugefügt.</b></td>'
		else:
			output += '<td><b style="color:#00d;">Würde AntwortenTags hinzugefügt.</b></td>'
	else:
		output += '<td><b style="color:#d00;">Tags mit Ebene ' + str(aEbenenId) + ' bereits vorhanden!</b></td>'
	return output
