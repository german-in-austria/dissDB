from django.shortcuts import render, render_to_response, redirect
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound
from django.template import RequestContext, loader
from django.db.models import Count, Q
import datetime


def start(request, ipk=0, apk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	aFormular = 'AnnotationsDB/start_formular.html'
	test = ''
	error = ''
	apk = int(apk)
	ipk = int(ipk)
	
	return render_to_response(
		'AnnotationsDB/start.html',
		RequestContext(request, {'test': test}),)
