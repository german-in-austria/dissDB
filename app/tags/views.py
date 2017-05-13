from django.shortcuts import get_object_or_404 , render_to_response , redirect
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound
from django.template import RequestContext, loader
import Datenbank.models as dbmodels
import bearbeiten.models as preTags
from django.db.models import Count
from DB.funktionenDB import formularView
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

def tagsedit(request):
	info = ''
	error = ''
	if not request.user.is_authenticated():
		return redirect('dioedb_login')
	app_name = 'Datenbank'
	tabelle_name = 'Tags'
	permName = 'personen'
	primaerId = 'tags'
	aktueberschrift = 'Tags'
	asurl = '/tags/tagsedit/'
	if not request.user.has_perm(app_name+'.'+permName+'_maskView'):
		return redirect('Startseite:start')

	aufgabenform = [
		{'titel':'Tag','titel_plural':'Tags','app':'Datenbank','tabelle':'Tags','id':'tags','optionen':['einzeln','elementFrameless'],
		 'felder':['+id','Tag','Tag_lang','zu_Phaenomen','Kommentar','Generation','AReihung'],
 		 'sub':[
	 		{'titel':'Tag Ebene zu Tag','titel_plural':'Tag Ebenen zu Tag','app':'Datenbank','tabelle':'TagEbeneZuTag','id':'tagebenezutag','optionen':['liste'],
 		 	 'felder':['+id','|id_Tag=parent:id','id_TagEbene']
		 	}
		 ]
		}
	]
	return formularView(app_name,tabelle_name,permName,primaerId,aktueberschrift,asurl,aufgabenform,request,info,error)
