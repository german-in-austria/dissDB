from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import json
from DB.funktionenDB import httpOutput
import operator


def startvue(request, ipk=0, tpk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	ipk = int(ipk)
	tpk = int(tpk)
	if 'speichern' in request.POST:
		sData = json.loads(request.POST.get('speichern'))
		print(sData)
		# aAntworten speichern!
		# ToDo: speichern und ggf. neue Id hinzufügen. Siehe aTokenSets!
		# aTokenSets speichern
		if 'aTokenSets' in sData:
			for key, value in sData['aTokenSets'].items():
				aId = int(key)
				if aId > 0:
					aElement = adbmodels.tbl_tokenset.objects.get(id=aId)
				else:
					aElement = adbmodels.tbl_tokenset()
				setattr(aElement, 'id_von_token_id', (value['ivt'] if 'ivt' in value else None))
				setattr(aElement, 'id_bis_token_id', (value['ibt'] if 'ibt' in value else None))
				aElement.save()
				value['nId'] = aElement.pk
				if 't' in value:
					for aTokenId in value['t']:
						try:
							aTokenToSet = adbmodels.tbl_tokentoset.objects.get(id_tokenset=value['nId'], id_token=aTokenId)
						except adbmodels.tbl_tokentoset.DoesNotExist:
							aTokenToSet = adbmodels.tbl_tokentoset()
						setattr(aTokenToSet, 'id_tokenset_id', value['nId'])
						setattr(aTokenToSet, 'id_token_id', aTokenId)
						aTokenToSet.save()
		print(sData)
		return httpOutput(json.dumps({'OK': True, 'gespeichert': sData}), 'application/json')

	if 'getTranskript' in request.POST:
		tpk = int(request.POST.get('getTranskript'))
	if tpk > 0:
		maxQuerys = 250
		dataout = {}
		if 'aType' in request.POST and request.POST.get('aType') == 'start':
			aTranskriptData = adbmodels.transcript.objects.get(pk=tpk)
			aTranskript = {'pk': aTranskriptData.pk, 'ut': aTranskriptData.update_time.strftime("%d.%m.%Y- %H:%M"), 'n': aTranskriptData.name}
			aEinzelErhebung = {}
			aEinzelErhebungData = dbmodels.EinzelErhebung.objects.filter(id_transcript_id=tpk)
			if aEinzelErhebungData:
				aEinzelErhebungData = aEinzelErhebungData[0]
				aEinzelErhebung = {
					'pk': aEinzelErhebungData.pk, 'trId': aEinzelErhebungData.id_transcript_id, 'd': aEinzelErhebungData.Datum.strftime("%d.%m.%Y- %H:%M"), 'e': aEinzelErhebungData.Explorator, 'k': aEinzelErhebungData.Kommentar,
					'dp': aEinzelErhebungData.Dateipfad, 'af': aEinzelErhebungData.Audiofile,
					'lf': aEinzelErhebungData.Logfile, 'o': aEinzelErhebungData.Ort, 'b': aEinzelErhebungData.Besonderheiten}
			aTokenTypes = {}
			for aTokenType in adbmodels.token_type.objects.filter(token__transcript_id_id=tpk):
				aTokenTypes[aTokenType.pk] = {'n': aTokenType.token_type_name}
			aInformanten = {}
			for aInf in adbmodels.token.objects.filter(transcript_id_id=tpk).values('ID_Inf').annotate(total=Count('ID_Inf')).order_by('ID_Inf'):
				aInfM = dbmodels.Informanten.objects.get(id=aInf['ID_Inf'])
				aInformanten[aInfM.pk] = {'k': aInfM.Kuerzel, 'ka': aInfM.Kuerzel_anonym}
			aSaetze = {}
			for aSatz in dbmodels.Saetze.objects.filter(token__transcript_id_id=tpk):
				aSaetze[aSatz.pk] = {'t': aSatz.Transkript, 's': aSatz.Standardorth, 'k': aSatz.Kommentar}
			aTmNr = int(adbmodels.event.objects.prefetch_related('rn_token_event_id').filter(rn_token_event_id__transcript_id_id=tpk).distinct().order_by('start_time').count() / maxQuerys)
			dataout.update({'aTranskript': aTranskript, 'aEinzelErhebung': aEinzelErhebung, 'aTokenTypes': aTokenTypes, 'aInformanten': aInformanten, 'aSaetze': aSaetze, 'aTmNr': aTmNr})
		aNr = 0
		aEvents = []
		aTokens = {}
		if 'aNr' in request.POST:
			aNr = int(request.POST.get('aNr'))
		nNr = aNr
		startQuery = aNr * maxQuerys
		endQuery = startQuery + maxQuerys
		for aEvent in adbmodels.event.objects.prefetch_related('rn_token_event_id').filter(rn_token_event_id__transcript_id_id=tpk).distinct().order_by('start_time')[startQuery:endQuery]:
			aEITokens = {}
			for aEIToken in sorted(list(aEvent.rn_token_event_id.all()), key=operator.attrgetter("token_reihung")):
				if aEIToken.ID_Inf_id not in aEITokens:
					aEITokens[aEIToken.ID_Inf_id] = []
				aEITokens[aEIToken.ID_Inf_id].append(aEIToken.id)
				aTokenset = {
					't': aEIToken.text,
					'tt': aEIToken.token_type_id_id,
					'tr': aEIToken.token_reihung,
					'e': aEIToken.event_id_id,
					'to': aEIToken.text_in_ortho,
					'i': aEIToken.ID_Inf_id,
				}
				if aEIToken.ortho:
					aTokenset['o'] = aEIToken.ortho
				if aEIToken.sentence_id_id:
					aTokenset['s'] = aEIToken.sentence_id_id
				if aEIToken.sequence_in_sentence:
					aTokenset['sr'] = aEIToken.sequence_in_sentence
				if aEIToken.fragment_of_id:
					aTokenset['fo'] = aEIToken.fragment_of_id
				if aEIToken.likely_error:
					aTokenset['le'] = 1
				aTokens[aEIToken.pk] = aTokenset
			aEvents.append({'pk': aEvent.pk, 's': str(aEvent.start_time), 'e': str(aEvent.end_time), 'l': str(aEvent.layer if aEvent.layer else 0), 'tid': aEITokens})
		if len(aEvents) == maxQuerys:
			nNr += 1
		dataout.update({'nNr': nNr, 'aEvents': aEvents, 'aTokens': aTokens})
		return httpOutput(json.dumps(dataout), 'application/json')

	if 'getMenue' in request.POST:
		if 'ainformant' in request.POST:
			ipk = int(request.POST.get('ainformant'))
		informantenMitTranskripte = []
		translist = list(adbmodels.token.objects.values('ID_Inf', 'transcript_id').distinct().order_by('ID_Inf'))
		for val in dbmodels.Informanten.objects.all():
			atc = 0
			for atl in translist:
				if atl['ID_Inf'] == val.pk:
					atc += 1
			informantenMitTranskripte.append({'model': {'pk': val.pk, 'model_str': str(val)}, 'Acount': atc})
		aTranskripte = []
		if ipk > 0:
			aTranskripte = [{'model': {'pk': val.pk, 'model_str': str(val), 'update_time': val.update_time.strftime("%d.%m.%Y- %H:%M"), 'name': val.name}, 'count': val.token_set.count()} for val in [adbmodels.transcript.objects.get(pk=atid['id']) for atid in adbmodels.transcript.objects.filter(token__ID_Inf=ipk).values('id').annotate(total=Count('id'))]]
		return httpOutput(json.dumps({'informantenMitTranskripte': informantenMitTranskripte, 'aInformant': ipk, 'aTranskripte': aTranskripte}), 'application/json')

	return render_to_response('AnnotationsDB/startvue.html', RequestContext(request))
