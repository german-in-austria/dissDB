from django.shortcuts import render, render_to_response, redirect
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound
from django.template import RequestContext, loader
from django.db.models import Count, Q
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import datetime


def start(request, ipk=0, tpk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	# aFormular = 'AnnotationsDB/start_formular.html'
	test = ''
	error = ''
	ipk = int(ipk)
	if 'ainformant' in request.POST:
		ipk = int(request.POST.get('ainformant'))
	tpk = int(tpk)

	informantenMitTranskripte = [{'model': val, 'Acount': len(adbmodels.transcript.objects.filter(token__ID_Inf=val).values('id').annotate(total=Count('id')))} for val in dbmodels.Informanten.objects.all()]
	aTranskripte = []
	if ipk > 0:
		aTranskripte = [{'model': val, 'count': val.token_set.count()} for val in [adbmodels.transcript.objects.get(pk=atid['id']) for atid in adbmodels.transcript.objects.filter(token__ID_Inf=ipk).values('id').annotate(total=Count('id'))]]

	return render_to_response(
		'AnnotationsDB/start.html',
		RequestContext(request, {'informantenMitTranskripte': informantenMitTranskripte, 'aInformant': ipk, 'aTranskripte': aTranskripte, 'test': test}),)
