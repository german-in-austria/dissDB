from django.shortcuts import render_to_response, redirect
import json
from DB.funktionenDB import httpOutput
from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
from django.db.models import Q
from django.db import connection
import math


def view(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	output = '<!doctype html><meta charset="utf-8"><html><body><div style="max-width:1800px;margin:10px auto;">'
	with open('AnnotationsDB/converter0.json', 'r', encoding='utf8') as file:
		aData = json.load(file)
	rows = ['DBresult', 'idtagebene', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
	maxPerSite = 10
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
		aTokens = adbmodels.token.objects.filter(Q(splemma=aLine['DBresult']) | Q(ttlemma=aLine['DBresult']) | Q(ortho=aLine['DBresult'])).exclude(ID_Inf_id=35).order_by('token_reihung')
		# print(aLine['DBresult'], aTokens.count())
		output += '<td valign="top" style="border-bottom: 1px solid #000;">'
		output += '<table style="text-align:right;width:100%;"><tr><th># ' + str(len(aTokens)) + '</th><th>Id</th><th>splemma</th><th>ttlemma</th><th>ortho</th><th>Reihung</th><th>Tokens ermittelt</th><th>Tokens verwenden</th><th>Typ</th><th>Vorhanden</th></tr>'
		dg = 1
		for aToken in aTokens:
			output += '<tr>'
			output += '<td>' + str(dg) + '</td><td>' + str(aToken.id) + '</td><td>' + str(aToken.splemma) + '</td><td>' + str(aToken.ttlemma) + '</td><td>' + str(aToken.ortho) + '</td><td>' + str(aToken.token_reihung) + '</td>'
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
							LIMIT 3
						)
					) AS atok
				''', [aToken.ID_Inf_id, aToken.transcript_id_id, aToken.token_reihung])
				xTokens = cursor.fetchone()[0]
			xTokens = reversed(xTokens)
			if xTokens:
				# print(alDg, '/', len(aData), '-', dg, '/', len(aTokens))
				output += '<td>'
				uTokens = []
				for xToken in xTokens:
					output += (xToken['ortho'] or xToken['text']) + '(' + str(xToken['id']) + ', ' + str(xToken['token_type_id_id']) + ') | '
					if xToken['token_type_id_id'] == 2:
						uTokens = []
					else:
						uTokens.append(xToken)
				output += '</td><td>'
				for uToken in uTokens:
					output += (uToken['ortho'] or uToken['text']) + '(' + str(uToken['id']) + ') | '
				output += '</td><td>'
				if len(uTokens) < 1:
					output += '<b style="color:#e00;">Error</b></td><td><b style="color:#e00;">Error</b>'
				elif len(uTokens) == 1:
					output += 'token'
					output += '</td><td>'
					if dbmodels.Antworten.objects.filter(ist_token_id=uTokens[0]['id']).count() > 0:
						output += '<b style="color:#d00;">Ja</b>'
					else:
						output += '<b style="color:#0d0;">Nein</b>'
						# ToDo: erstellen
				else:
					output += 'tokenset'
					output += '</td><td>'
					if adbmodels.tbl_tokenset.objects.filter(id_von_token=uTokens[0]['id'], id_bis_token=uTokens[-1]['id']).count() > 0:
						output += '<b style="color:#d00;">Ja</b>'
					else:
						output += '<b style="color:#0d0;">Nein</b>'
						# ToDo: erstellen
				output += '</td>'
			output += '</tr>'
			dg += 1
		output += '</table>'
		output += '</td>'
		output += '</tr>'
		alDg += 1
	output += '</table>'
	return httpOutput(output + '</div></body></html>', 'text/html')
