from django.shortcuts import render , render_to_response , redirect
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound
from django.template import RequestContext, loader
from django.apps import apps
import collections
from django.core import serializers
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.contenttypes.models import ContentType
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from DB.forms import GetModelForm
from DB.funktionenDB import kategorienListe, felderAuslesen, verbundeneElemente, httpOutput
from django.conf import settings
import json
from django.db import connection
from django.views.decorators.csrf import csrf_exempt


def refreshcache(request,app_name,tabelle_name):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	# Gibt es die Tabelle?
	try : amodel = apps.get_model(app_name, tabelle_name)
	except LookupError : return HttpResponseNotFound('<h1>Tabelle "'+tabelle_name+'" nicht gefunden!</h1>')
	try:
		success = json.dumps({'success':'success','db_table':str(amodel._meta.db_table),'refreshCache':amodel.refreshCache(),})
	except Exception as e:
		success = json.dumps({'error':str(type(e))+' - '+str(e),'db_table':str(amodel._meta.db_table),})
	return httpOutput(success, mimetype='application/json')


def getDuration(request,app_name,tabelle_name):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	# Gibt es die Tabelle?
	try : amodel = apps.get_model(app_name, tabelle_name)
	except LookupError : return HttpResponseNotFound('<h1>Tabelle "' + tabelle_name + '" nicht gefunden!</h1>')
	try:
		success = json.dumps({'success': 'success', 'db_table': str(amodel._meta.db_table), 'refreshCache': amodel.getDuration(), })
	except Exception as e:
		success = json.dumps({'error':str(type(e))+' - '+str(e),'db_table':str(amodel._meta.db_table),})
	return httpOutput(success, mimetype='application/json')


def resetidseq(request,app_name,tabelle_name):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	# Gibt es die Tabelle?
	try : amodel = apps.get_model(app_name, tabelle_name)
	except LookupError : return HttpResponseNotFound('<h1>Tabelle "'+tabelle_name+'" nicht gefunden!</h1>')
	# Reset id sequence
	try:
		cursor = connection.cursor()
		cursor.execute("SELECT setval('\""+amodel._meta.db_table+"_id_seq\"',  (SELECT MAX(id) FROM \""+amodel._meta.db_table+"\")+1, FALSE)")
		success = json.dumps({'success':'success','db_table':str(amodel._meta.db_table),})
	except Exception as e:
		success = json.dumps({'error':str(type(e))+' - '+str(e),'db_table':str(amodel._meta.db_table),})
	return httpOutput(success, mimetype='application/json')


# Startseite - Übersicht über alle verfügbaren Tabellen
def start(request):
	info = ''
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')

	# Liste der verfuegbaren Tabellen:
	tabellen = collections.OrderedDict()
	applist = settings.DIOEDB_APPLIST
	for aapp in applist:
		if request.user.has_perm(aapp+'.edit'):
			tabellen[aapp] = []
			for model in apps.get_app_config(aapp).models.items():
				amodel = apps.get_model(aapp, model[0])
				if str(model[0])[:4]!='sys_':
					tabellen[aapp].append({'model':model[0],'titel':amodel._meta.verbose_name_plural,'count':amodel.objects.count(),'refreshCache':(request.user.is_superuser and hasattr(amodel, 'refreshCache'))})
	# Ausgabe der Seite
	return render_to_response('DB/start.html',
		RequestContext(request, {'tabellen':(tabellen.items()),'database':settings.DATABASES['default']['ENGINE'],'info':info}),)


# Ansicht - Übersicht über Tabelleneinträge mit Option zum bearbeiten
def view(request,app_name,tabelle_name):
	info = ''
	error = ''
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')

	# Gibt es die Tabelle?
	try : amodel = apps.get_model(app_name, tabelle_name)
	except LookupError : return HttpResponseNotFound('<h1>Tabelle "'+tabelle_name+'" nicht gefunden!</h1>')

	# Liste der Buchstaben mit Anzahl der Elemente
	if 'getlmfal' in request.POST:
		# print(kategorienListe(amodel))
		return render_to_response('DB/lmfal.html',
			RequestContext(request, {'kategorien_liste':kategorienListe(amodel).items(),'appname':app_name,'tabname':tabelle_name,'info':info,'error':error}),)

	# Liste der Einträge des jeweiligen Buchstaben ausgeben
	if 'getlmfadl' in request.POST:
		return render_to_response('DB/lmfadl.html',
			RequestContext(request, {'lmfadl':kategorienListe(amodel,inhalt=request.POST.get('getlmfadl')),'info':info,'error':error}),)

	# Reine View des Tabelleneintrags !!!
	if 'gettableview' in request.POST:
		aElement = amodel.objects.get(pk=request.POST.get('gettableview'))
		return render_to_response('DB/view_table.html',
			RequestContext(request, {'aelement':aElement,'aelementapp':aElement._meta.app_label,'aelementtabelle':aElement.__class__.__name__,'fields':felderAuslesen(aElement,1),'usedby':verbundeneElemente(aElement),'amodel_meta':amodel._meta,'info':info,'error':error}),)

	# Ausgabe der Standard Seite mit geladenen Tabelleneintrag !
	if 'loadpk' in request.POST:
		aElement = amodel.objects.get(pk=request.POST.get('loadpk'))
		acontent = render_to_response('DB/view_table.html',
			RequestContext(request, {'aelement':aElement,'aelementapp':aElement._meta.app_label,'aelementtabelle':aElement.__class__.__name__,'fields':felderAuslesen(aElement,1),'usedby':verbundeneElemente(aElement),'amodel_meta':amodel._meta,'info':info,'error':error}),).content
		return render_to_response('DB/view.html',
			RequestContext(request, {'kategorien_liste':kategorienListe(amodel,mitInhalt=int(request.POST.get('loadpk')),arequest=request).items(),'appname':app_name,'tabname':tabelle_name,'amodel_meta':amodel._meta,'acontent':acontent,'amodel_count':amodel.objects.count(),'info':info,'error':error}),)

	# Reines Formular des Tabelleneintrags
	if 'gettableeditform' in request.POST:
		if int(request.POST.get('gettableeditform')) > 0:
			aElement = amodel.objects.get(pk=request.POST.get('gettableeditform'))
			aform = GetModelForm(amodel,instance=aElement)
		else:
			aElement = amodel()
			aform = GetModelForm(amodel)
		return render_to_response('DB/edit_table.html',
			RequestContext(request, {'aelement':aElement,'aelementapp':aElement._meta.app_label,'aelementtabelle':aElement.__class__.__name__,'amodel_meta':amodel._meta,'aform':aform,'pktitel':aElement._meta.pk.verbose_name,'pkvalue':aElement.pk,'info':info,'error':error}),)

	# Formular ForeignKey Select
	if 'getforeignkeysel' in request.POST:
		try:
			aElement = amodel.objects.get(pk=request.POST.get('getforeignkeysel'))
			acontent = render_to_response('DB/view_table.html',
				RequestContext(request, {'aelement':aElement,'aelementapp':aElement._meta.app_label,'aelementtabelle':aElement.__class__.__name__,'fields':felderAuslesen(aElement,1),'usedby':verbundeneElemente(aElement),'amodel_meta':amodel._meta,'info':info,'error':error}),).content
			return render_to_response('DB/foreignkeysel.html',
				RequestContext(request, {'kategorien_liste':kategorienListe(amodel,mitInhalt=int(request.POST.get('getforeignkeysel')),arequest=request).items(),'appname':app_name,'tabname':tabelle_name,'amodel_meta':amodel._meta,'acontent':acontent,'info':info,'error':error}),)
		except ObjectDoesNotExist:
			return render_to_response('DB/foreignkeysel.html',
				RequestContext(request, {'kategorien_liste':kategorienListe(amodel).items(),'appname':app_name,'tabname':tabelle_name,'amodel_meta':amodel._meta,'acontent':'','info':info,'error':error}),)

	# Formular speichern
	if 'saveform' in request.POST and request.user.has_perm(app_name+'.edit'):
		# Neues Formular speichern !!!!!!!!!
		if int(request.POST.get('savepk')) > 0:
			aElement = amodel.objects.get(pk=request.POST.get('savepk'))
			aform = GetModelForm(amodel,request.POST,instance=aElement)
		else:
			aElement = amodel()
			aform = GetModelForm(amodel,request.POST)
		if aform.is_valid():
			aElement = aform.save()
			LogEntry.objects.log_action(
				user_id = request.user.pk,
				content_type_id = ContentType.objects.get_for_model(aElement).pk,
				object_id = aElement.pk,
				object_repr = str(aElement),
				action_flag = CHANGE if int(request.POST.get('savepk')) > 0 else ADDITION
			)
			info = 'Datensatz gespeichert.'
			return render_to_response('DB/view_table.html',
				RequestContext(request, {'aelement':aElement,'aelementapp':aElement._meta.app_label,'aelementtabelle':aElement.__class__.__name__,'fields':felderAuslesen(aElement,1),'usedby':verbundeneElemente(aElement),'amodel_meta':amodel._meta,'info':info,'error':error}),)
		else:
			error = 'Fehlerhafte Eingabe!'
		return render_to_response('DB/edit_table.html',
			RequestContext(request, {'aelement':aElement,'aelementapp':aElement._meta.app_label,'aelementtabelle':aElement.__class__.__name__,'amodel_meta':amodel._meta,'aform':aform,'pktitel':aElement._meta.pk.verbose_name,'pkvalue':aElement.pk,'info':info,'error':error}),)
	# Element loeschen
	if 'delobj' in request.POST and request.user.has_perm(app_name+'.edit'):
		aElement = amodel.objects.get(pk=request.POST.get('delobj'))
		error = str(aElement)+' (PK: '+str(aElement.pk)+') wurde geloescht!'
		aElement.delete()
		LogEntry.objects.log_action(
			user_id = request.user.pk,
			content_type_id = ContentType.objects.get_for_model(aElement).pk,
			object_id = aElement.pk,
			object_repr = str(aElement),
			action_flag = DELETION
		)
		return render_to_response('DB/view_empty.html',
			RequestContext(request, {'amodel_meta':amodel._meta,'appname':app_name,'tabname':tabelle_name,'info':info,'error':error}),)


	# Ausgabe der Standard Seite
	return render_to_response('DB/view.html',
		RequestContext(request, {'kategorien_liste':kategorienListe(amodel).items(),'appname':app_name,'tabname':tabelle_name,'amodel_meta':amodel._meta,'amodel_count':amodel.objects.count(),'info':info,'error':error}),)

# Suche
def search(request):
	info = ''
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')

	# Nach OpenStreetMap Orten in der tbl_orte suchen ...
	if 'sucheorte' in request.POST:
		suchorte = json.loads(request.POST.get('suchorte'))
		ortModel = apps.get_model('PersonenDB', 'tbl_orte')
		for suchort in suchorte:
			print(suchort['osm_id']+' - '+suchort['osm_type'])
			try:
				ortObjekt = ortModel.objects.filter(osm_id=suchort['osm_id'],osm_type=suchort['osm_type']).order_by('pk').first()
				suchort['ort_pk'] = ortObjekt.pk
			except:
				pass
		return httpOutput('OK'+json.dumps(suchorte))

	# Nach Ort in der tbl_orte suchen und als Json ausgeben
	if 'getort' in request.POST:
		ortData = {}
		ortModel = apps.get_model('PersonenDB', 'tbl_orte')
		try:
			ortObjekt = ortModel.objects.get(pk=request.POST.get('getort'))
			ortData['pk'] = ortObjekt.pk
			ortData['ort_namelang'] = ortObjekt.ort_namelang
			ortData['lat'] = ortObjekt.lat
			ortData['lon'] = ortObjekt.lon
			ortData['osm_id'] = ortObjekt.osm_id
			ortData['osm_type'] = ortObjekt.osm_type
		except:
			pass
		return httpOutput('OK'+json.dumps(ortData))

	return httpOutput('Error: Keine kompatible Suche!')


def view_diagramm(request):
	"""Standard Anzeige für Model Diagramme."""
	from .models import sys_diagramm_tabellenpositionen
	info = ''
	error = ''
	# Modelposition speichern
	if 'speichere' in request.POST:
		if request.POST.get('speichere') == 'positionen':
			positionen = json.loads(request.POST.get('positionen'))
			for position in positionen:
				if request.user.has_perm(position['app'] + '.edit'):
					try:
						amodel = sys_diagramm_tabellenpositionen.objects.get(zu_app=position['app'], zu_model=position['model'])
					except:
						amodel = sys_diagramm_tabellenpositionen()
						amodel.zu_app = position['app']
						amodel.zu_model = position['model']
					amodel.xt = position['xt']
					amodel.yt = position['yt']
					amodel.save()
			return httpOutput('OK')
	# Models auslesen
	tabellen = []
	applist = settings.DIOEDB_APPLIST
	for aapp in applist:
		if request.user.has_perm(aapp + '.edit'):
			for model in apps.get_app_config(aapp).models.items():
				if str(model[0])[:4] != 'sys_':
					amodel = apps.get_model(aapp, model[0])
					aFields = []
					xt = 0
					yt = 0
					try:
						asdtp = sys_diagramm_tabellenpositionen.objects.get(zu_app=aapp, zu_model=str(model[0]))
						xt = asdtp.xt
						yt = asdtp.yt
					except:
						pass
					for f in amodel._meta.get_fields():
						if not f.auto_created or amodel._meta.pk.name == f.name:
							aField = {
								'field_name': f.name,
								'verbose_name': f._verbose_name,
								'internal_type': f.get_internal_type(),
								'unique': f.unique,
								'blank': f.blank,
								'null': f.null,
							}
							if amodel._meta.pk.name == f.name:
								aField['pk'] = True
							if f.is_relation:
								aField['related_db_table'] = f.related_model._meta.db_table
							aFields.append(aField)
					tabellen.append({
						'model': model[0],
						'app': aapp,
						'verbose_name': amodel._meta.verbose_name,
						'verbose_name_plural': amodel._meta.verbose_name_plural,
						'count': amodel.objects.count(),
						'db_table': amodel._meta.db_table,
						'get_fields': aFields,
						'xt': xt,
						'yt': yt,
					})
	tabellen = json.dumps(tabellen)
	# Ausgabe der Seite
	return render_to_response(
		'DB/diagramm.html',
		RequestContext(request, {'tabellen': tabellen, 'error': error, 'info': info}),
	)


@csrf_exempt
def tagsystemvue(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	import Datenbank.models as dbmodels
	output = {}
	if 'getBase' in request.POST:
		tagebenen = []
		for TagEbene in dbmodels.TagEbene.objects.all():
			tagebenen.append({'pk': TagEbene.pk, 't': TagEbene.Name})
		output['tagebenen'] = tagebenen
		phaenomene = {}
		for phaenomen in dbmodels.Phaenomene.objects.all():
			phaenomene[phaenomen.pk] = {
				'b': phaenomen.Bez_Phaenomen,
				'bs': phaenomen.Beschr_Phaenomen,
				'zpb': phaenomen.zu_PhaenBer,
				'k': phaenomen.Kommentar
			}
		output['phaenomene'] = phaenomene
	if 'getTags' in request.POST:
		tags = {}
		tagsReihung = []
		for tag in dbmodels.Tags.objects.prefetch_related('tagebenezutag_set', 'id_ParentTag', 'id_ChildTag').all():
			tagsReihung.append(tag.pk)
			tags[tag.pk] = {
				't': tag.Tag,
				'tl': tag.Tag_lang,
				'k': tag.Kommentar,
				'r': tag.AReihung,
				'g': tag.Generation,
			}
			if tag.zu_Phaenomen:
				tags[tag.pk]['zppk'] = tag.zu_Phaenomen_id
			try:
				tmpTezt = []
				for tezt in tag.tagebenezutag_set.all():
					tmpTezt.append(tezt.id_TagEbene_id)
				if tmpTezt:
					tags[tag.pk]['tezt'] = tmpTezt
			except:
				pass
			try:
				tmpChilds = []
				for aCTags in tag.id_ParentTag.all().order_by('id_ParentTag__AReihung'):
					tmpChilds.append(aCTags.id_ChildTag_id)
				if tmpChilds:
					tags[tag.pk]['c'] = tmpChilds
			except:
				pass
			try:
				tmpParents = []
				for aCTags in tag.id_ChildTag.all().order_by('id_ChildTag__AReihung'):
					tmpParents.append(aCTags.id_ParentTag_id)
				if tmpParents:
					tags[tag.pk]['p'] = tmpParents
			except:
				pass
		output['tags'] = {'tags': tags, 'tagsReihung': tagsReihung}
	if 'getPresets' in request.POST:
		import bearbeiten.models as bmodels
		aPresetTags = []
		# for val in bmodels.PresetTags.objects.filter(Q(presettagszuaufgabe__id_Aufgabe__pk=apk) | Q(presettagszuaufgabe=None)):
		for val in bmodels.PresetTags.objects.prefetch_related('id_Tags').all():
			tfVal = getTagFamiliePT(val.id_Tags.all())
			if tfVal:
				aPresetTags.append({'tf': tfVal})
		output['presets'] = aPresetTags
	return httpOutput(json.dumps(output), mimetype='application/json')


def getTagFamiliePT(Tags):
	afam = []
	oTags = []
	for value in Tags:
		pClose = 0
		try:
			while not value.id_ChildTag.filter(id_ParentTag=afam[-1].pk):
				pClose += 1
				del afam[-1]
		except:
			pass
		oTags.append({'t': value.pk, 'c': pClose})
		afam.append(value)
	return oTags


# Dateien
def dateien(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	if not request.user.has_perm('DB.dateien'):
		return redirect('Startseite:start')
	from .funktionenDateien import view_dateien
	return view_dateien(request)
