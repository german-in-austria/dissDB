from django.shortcuts import render , render_to_response , redirect
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound
from django.template import RequestContext, loader
import Datenbank.models as dbmodels
from .models import PresetTags
from django.db.models import Count
import datetime
import json

def getTagList(Tags,TagPK):
	TagData = []
	if TagPK == None:
		#pprint.pprint(dir(Tags))
		for value in Tags.objects.filter(id_ChildTag=None):
			child=getTagList(Tags,value.pk)
			TagData.append({'model':value,'child':child})
	else:
		for value in Tags.objects.filter(id_ChildTag__id_ParentTag=TagPK):
			child=getTagList(Tags,value.pk)
			TagData.append({'model':value,'child':child})
	return TagData

def start(request,ipk=0,apk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	aFormular = 'bearbeiten/start_formular.html'
	test = ''
	error = ''
	apk=int(apk)
	ipk=int(ipk)
	if apk>0 and ipk>0:
		if 'save' in request.POST:
			if request.POST.get('save') == 'ErhInfAufgaben':
				saveErhInfAufgaben = dbmodels.ErhInfAufgaben.objects.get(pk=int(request.POST.get('pk')))
				saveErhInfAufgaben.start_Aufgabe = datetime.timedelta(microseconds=int(float(request.POST.get('start_Aufgabe') if request.POST.get('start_Aufgabe') else 0)*1000000))
				saveErhInfAufgaben.stop_Aufgabe = datetime.timedelta(microseconds=int(float(request.POST.get('stop_Aufgabe') if request.POST.get('stop_Aufgabe') else 0)*1000000))
				saveErhInfAufgaben.save()
				aFormular = 'bearbeiten/audio_formular.html'
			elif request.POST.get('save') == 'Aufgaben':
				for aAntwort in json.loads(request.POST.get('aufgaben')):
					if 'delit' in aAntwort:		# Löschen
						aDelAntwort = dbmodels.Antworten.objects.get(pk=aAntwort['id_Antwort'])
						test+=str(aDelAntwort)+' Löschen!<br>'
						if aDelAntwort.ist_Satz:
							aDelAntwort.ist_Satz.delete()
							test+='Satz gelöscht<br>'
						aDelAntwort.delete()
						test+='<hr>'
					else:						# Speichern/Erstellen
						if aAntwort['Kommentar'] or aAntwort['ist_Satz_Standardorth'] or aAntwort['ist_bfl'] or aAntwort['bfl_durch_S'] or aAntwort['ist_Satz_Transkript'] or aAntwort['start_Antwort'] or aAntwort['stop_Antwort'] or aAntwort['tags']:
							if int(aAntwort['id_Antwort']) > 0:		# Speichern
								aSaveAntwort = dbmodels.Antworten.objects.get(pk=aAntwort['id_Antwort'])
								sTyp = ' gespeichert!<br>'
							else:									# Erstellen
								aSaveAntwort = dbmodels.Antworten()
								sTyp = ' erstellt!<br>'
							aSaveAntwort.ist_gewaehlt = False
							aSaveAntwort.ist_nat = False
							aSaveAntwort.von_Inf = dbmodels.Informanten.objects.get(pk=int(aAntwort['von_Inf']))
							aSaveAntwort.zu_Aufgabe = dbmodels.Aufgaben.objects.get(pk=int(aAntwort['zu_Aufgabe']))
							aSaveAntwort.Reihung = int(aAntwort['reihung'])
							aSaveAntwort.ist_bfl = aAntwort['ist_bfl']
							aSaveAntwort.bfl_durch_S = aAntwort['bfl_durch_S']
							aSaveAntwort.start_Antwort = datetime.timedelta(microseconds=int(float(aAntwort['start_Antwort'] if aAntwort['start_Antwort'] else 0)*1000000))
							aSaveAntwort.stop_Antwort = datetime.timedelta(microseconds=int(float(aAntwort['stop_Antwort'] if aAntwort['stop_Antwort'] else 0)*1000000))
							aSaveAntwort.Kommentar = aAntwort['Kommentar']
							if int(aAntwort['ist_Satz_pk']) > 0:	# Satz bearbeiten
								asSatz = dbmodels.Saetze.objects.get(pk=aAntwort['ist_Satz_pk'])
								ssTyp = ' gespeichert!<br>'
							else:									# Satz erstellen
								asSatz = dbmodels.Saetze()
								ssTyp = ' erstellt!<br>'
							asSatz.Transkript = aAntwort['ist_Satz_Transkript']
							asSatz.Standardorth = aAntwort['ist_Satz_Standardorth']
							asSatz.save()
							aSaveAntwort.ist_Satz = asSatz
							test+= 'Satz "'+str(aSaveAntwort.ist_Satz)+'" (PK: '+str(aSaveAntwort.ist_Satz.pk)+')'+ssTyp
							aSaveAntwort.save()
							for asTag in aAntwort['tags']:
								if int(asTag['id_tag'])==0 or int(asTag['id_TagEbene'])==0:
									if int(asTag['pk']) > 0:
										aDelAntwortenTag = dbmodels.AntwortenTags.objects.get(pk=int(asTag['pk']))
										test+= 'AntwortenTag "'+str(aDelAntwortenTag)+'" (PK: '+str(aDelAntwortenTag.pk)+') gelöscht!<br>'
										aDelAntwortenTag.delete()
								else:
									if int(asTag['pk']) > 0:		# Tag bearbeiten
										asAntwortenTag = dbmodels.AntwortenTags.objects.get(pk=int(asTag['pk']))
										stTyp = ' gespeichert!<br>'
									else:							# Tag erstellen
										asAntwortenTag = dbmodels.AntwortenTags()
										stTyp = ' erstellt!<br>'
									asAntwortenTag.id_Antwort = aSaveAntwort
									asAntwortenTag.id_Tag =  dbmodels.Tags.objects.get(pk=int(asTag['id_tag']))
									asAntwortenTag.id_TagEbene =  dbmodels.TagEbene.objects.get(pk=int(asTag['id_TagEbene']))
									asAntwortenTag.Reihung =  int(asTag['reihung'])
									asAntwortenTag.save()
									test+= 'AntwortenTag "'+str(asAntwortenTag)+'" (PK: '+str(asAntwortenTag.pk)+')'+stTyp
							test+= 'Antwort "'+str(aSaveAntwort)+'" (PK: '+str(aSaveAntwort.pk)+')'+sTyp+'<hr>'
				aFormular = 'bearbeiten/antworten_formular.html'
		Informant = dbmodels.Informanten.objects.get(pk=ipk)
		Aufgabe = dbmodels.Aufgaben.objects.get(pk=apk)
		eAntwort = dbmodels.Antworten()
		eAntwort.von_Inf = Informant
		eAntwort.zu_Aufgabe = Aufgabe
		TagEbenen = dbmodels.TagEbene.objects.all()
		Tags = getTagList(dbmodels.Tags,None)
		Antworten = []
		for val in dbmodels.Antworten.objects.filter(von_Inf=ipk,zu_Aufgabe=apk).order_by('Reihung'):
			ptags=dbmodels.AntwortenTags.objects.filter(primaer=True,id_Antwort=val.pk).order_by('Reihung')
			stags=dbmodels.AntwortenTags.objects.filter(primaer=False,id_Antwort=val.pk).order_by('Reihung')
			xtags = []
			for xval in dbmodels.AntwortenTags.objects.filter(id_Antwort=val.pk).values('id_TagEbene').annotate(total=Count('id_TagEbene')).order_by('id_TagEbene'):
				xtags.append({'ebene':dbmodels.TagEbene.objects.filter(pk=xval['id_TagEbene']), 'tags':dbmodels.AntwortenTags.objects.filter(id_Antwort=val.pk, id_TagEbene=xval['id_TagEbene']).order_by('Reihung')})
			Antworten.append({'model':val, 'ptags':ptags, 'stags':stags, 'xtags':xtags})
		Antworten.append(eAntwort)
		ErhInfAufgaben = dbmodels.ErhInfAufgaben.objects.filter(id_Aufgabe=apk,id_InfErh__ID_Inf__pk=ipk)
		return render_to_response(aFormular,
			RequestContext(request, {'Informant':Informant,'Aufgabe':Aufgabe,'Antworten':Antworten, 'TagEbenen':TagEbenen ,'Tags':Tags,'ErhInfAufgaben':ErhInfAufgaben,'PresetTags':PresetTags.objects.all(),'test':test,'error':error}),)
	InformantenCount=dbmodels.Informanten.objects.all().count()
	aAufgabenset = 0 ; Aufgabensets = [{'model':val,'Acount':dbmodels.Aufgaben.objects.filter(von_ASet = val.pk).count()} for val in dbmodels.Aufgabensets.objects.all()]
	aAufgabe = 0		; Aufgaben = None
	Informanten = None
	if 'aaufgabenset' in request.POST:
		aAufgabenset = int(request.POST.get('aaufgabenset'))
		if 'infantreset' in request.POST:		# InformantenAntwortenUpdate
			aAufgabe = int(request.POST.get('aaufgabe'))
			aResponse = HttpResponse(str({str(val.pk):str(dbmodels.Antworten.objects.filter(von_Inf=val,zu_Aufgabe=aAufgabe).count()) for val in dbmodels.Informanten.objects.all()}).replace("'",'"'))
			aResponse['Content-Type'] = 'text/text'
			return aResponse
		if aAufgabenset == int(request.POST.get('laufgabenset')):
			aAufgabe = int(request.POST.get('aaufgabe'))
			Informanten = [{'model':val,'count':dbmodels.Antworten.objects.filter(von_Inf=val,zu_Aufgabe=aAufgabe).count} for val in dbmodels.Informanten.objects.all()]
		Aufgaben = []
		for val in dbmodels.Aufgaben.objects.filter(von_ASet=aAufgabenset):
			try:
				aproz = (100/InformantenCount*dbmodels.Antworten.objects.filter(zu_Aufgabe=val.pk).values('zu_Aufgabe').annotate(total=Count('von_Inf'))[0]['total'])
			except:
				aproz = 0
			Aufgaben.append({'model':val, 'aProz': aproz})

	# Ausgabe der Seite
	return render_to_response('bearbeiten/start.html',
		RequestContext(request, {'aAufgabenset':aAufgabenset,'Aufgabensets':Aufgabensets,'aAufgabe':aAufgabe,'Aufgaben':Aufgaben,'Informanten':Informanten,'test':test}),)
