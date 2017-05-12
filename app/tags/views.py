from django.shortcuts import render , render_to_response , redirect
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound
from django.template import RequestContext, loader
import Datenbank.models as dbmodels
import bearbeiten.models as preTags
from django.db.models import Count
import datetime
import json

# Create your views here.
def start(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	test = ''

	# Ausgabe der Seite
	return render_to_response('tags/start.html',
		RequestContext(request, {'test':test}),)
