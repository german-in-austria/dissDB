from django.shortcuts import render_to_response, redirect
import json
from DB.funktionenDB import httpOutput
from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
from django.db.models import Q


def view(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	output = '<!doctype html><meta charset="utf-8"><html><body><div style="max-width:1800px;margin:10px auto;">'
	with open('AnnotationsDB/converter0.json', 'r', encoding='utf8') as file:
		aData = json.load(file)
	rows = ['DBresult', 'idtagebene', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
	output += '<table><tr>'
	for row in rows:
		output += '<th align="left">' + row + '</th>'
	output += '<th align="left">Result</th>'
	output += '</tr>'
	for aLine in aData:
		output += '<tr>'
		for row in rows:
			output += '<td valign="top" style="border-bottom: 1px solid #000;">' + str(aLine[row]) + '</td>'
		aTokens = adbmodels.token.objects.filter(Q(splemma=aLine['DBresult']) | Q(ttlemma=aLine['DBresult']) | Q(ortho=aLine['DBresult'])).exclude(ID_Inf_id=35).order_by('token_reihung')
		# print(aLine['DBresult'], aTokens.count())
		output += '<td valign="top" style="border-bottom: 1px solid #000;">'
		output += '<table style="text-align: right;"><tr><th># ' + str(len(aTokens)) + '</th><th>Id</th><th>splemma</th><th>ttlemma</th><th>ortho</th><th>Reihung</th></tr>'
		dg = 1
		for aToken in aTokens:
			output += '<tr><td>' + str(dg) + '</td><td>' + str(aToken.id) + '</td><td>' + str(aToken.splemma) + '</td><td>' + str(aToken.ttlemma) + '</td><td>' + str(aToken.ortho) + '</td><td>' + str(aToken.token_reihung) + '</td></tr>'
			dg += 1
		output += '</table>'
		output += '</td>'
		output += '</tr>'
	output += '</table>'
	return httpOutput(output + '</div></body></html>', 'text/html')
