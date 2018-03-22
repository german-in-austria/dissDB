from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import json
from DB.funktionenDB import httpOutput


def start(request, ipk=0, tpk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	test = ''
	error = ''
	ipk = int(ipk)
	tpk = int(tpk)

	if tpk > 0:
		aTokenTypes = {}
		for aTokenType in adbmodels.token_type.objects.filter(token__transcript_id_id=tpk):
			aTokenTypes[aTokenType.pk] = {'n': aTokenType.token_type_name}
		aSaetze = {}
		for aSatz in dbmodels.Saetze.objects.filter(token__transcript_id_id=tpk):
			aSaetze[aSatz.pk] = {'t': aSatz.Transkript, 's': aSatz.Standardorth, 'k': aSatz.Kommentar}
		aEvents = []
		for aEvent in adbmodels.event.objects.filter(rn_token_event_id__transcript_id_id=tpk).distinct().order_by('start_time'):
			aEvents.append({'pk': aEvent.pk, 's': str(aEvent.start_time), 'e': str(aEvent.end_time), 'l': str(aEvent.layer if aEvent.layer else 0)})
		aInformanten = {}
		for aInf in adbmodels.token.objects.filter(transcript_id_id=tpk).values('ID_Inf').annotate(total=Count('ID_Inf')).order_by('ID_Inf'):
			aInfM = dbmodels.Informanten.objects.get(id=aInf['ID_Inf'])
			aInformanten[aInfM.pk] = {'k': aInfM.Kuerzel, 'ka': aInfM.Kuerzel_anonym}
		aTokens = {}
		for aToken in adbmodels.token.objects.filter(transcript_id_id=tpk).distinct().order_by('token_reihung'):
			aTokenset = {
				't': aToken.text,
				'tt': aToken.token_type_id_id,
				'tr': aToken.token_reihung,
				'e': aToken.event_id_id,
				'to': aToken.text_in_ortho,
				'i': aToken.ID_Inf_id,
			}
			if aToken.ortho:
				aTokenset['o'] = aToken.ortho
			if aToken.sentence_id_id:
				aTokenset['s'] = aToken.sentence_id_id
			if aToken.sequence_in_sentence:
				aTokenset['sr'] = aToken.sequence_in_sentence
			if aToken.fragment_of_id:
				aTokenset['fo'] = aToken.fragment_of_id
			if aToken.likely_error:
				aTokenset['le'] = 1
			aTokens[aToken.pk] = aTokenset
		return httpOutput(json.dumps({'aTokenTypes': aTokenTypes, 'aSaetze': aSaetze, 'aEvents': aEvents, 'aInformanten': aInformanten, 'aTokens': aTokens}), 'application/json')

	if 'ainformant' in request.POST:
		ipk = int(request.POST.get('ainformant'))

	informantenMitTranskripte = [{'model': val, 'Acount': len(adbmodels.transcript.objects.filter(token__ID_Inf=val).values('id').annotate(total=Count('id')))} for val in dbmodels.Informanten.objects.all()]
	aTranskripte = []
	if ipk > 0:
		aTranskripte = [{'model': val, 'count': val.token_set.count()} for val in [adbmodels.transcript.objects.get(pk=atid['id']) for atid in adbmodels.transcript.objects.filter(token__ID_Inf=ipk).values('id').annotate(total=Count('id'))]]

	return render_to_response(
		'AnnotationsDB/start.html',
		RequestContext(request, {'informantenMitTranskripte': informantenMitTranskripte, 'aInformant': ipk, 'aTranskripte': aTranskripte, 'test': test}),)


def startvue(request, ipk=0, tpk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	test = ''
	error = ''
	ipk = int(ipk)
	tpk = int(tpk)

	# if tpk > 0:
	# 	aTokenTypes = {}
	# 	for aTokenType in adbmodels.token_type.objects.filter(token__transcript_id_id=tpk):
	# 		aTokenTypes[aTokenType.pk] = {'n': aTokenType.token_type_name}
	# 	aSaetze = {}
	# 	for aSatz in dbmodels.Saetze.objects.filter(token__transcript_id_id=tpk):
	# 		aSaetze[aSatz.pk] = {'t': aSatz.Transkript, 's': aSatz.Standardorth, 'k': aSatz.Kommentar}
	# 	aEvents = []
	# 	for aEvent in adbmodels.event.objects.filter(rn_token_event_id__transcript_id_id=tpk).distinct().order_by('start_time'):
	# 		aEvents.append({'pk': aEvent.pk, 's': str(aEvent.start_time), 'e': str(aEvent.end_time), 'l': str(aEvent.layer if aEvent.layer else 0)})
	# 	aInformanten = {}
	# 	for aInf in adbmodels.token.objects.filter(transcript_id_id=tpk).values('ID_Inf').annotate(total=Count('ID_Inf')).order_by('ID_Inf'):
	# 		aInfM = dbmodels.Informanten.objects.get(id=aInf['ID_Inf'])
	# 		aInformanten[aInfM.pk] = {'k': aInfM.Kuerzel, 'ka': aInfM.Kuerzel_anonym}
	# 	aTokens = {}
	# 	for aToken in adbmodels.token.objects.filter(transcript_id_id=tpk).distinct().order_by('token_reihung'):
	# 		aTokenset = {
	# 			't': aToken.text,
	# 			'tt': aToken.token_type_id_id,
	# 			'tr': aToken.token_reihung,
	# 			'e': aToken.event_id_id,
	# 			'to': aToken.text_in_ortho,
	# 			'i': aToken.ID_Inf_id,
	# 		}
	# 		if aToken.ortho:
	# 			aTokenset['o'] = aToken.ortho
	# 		if aToken.sentence_id_id:
	# 			aTokenset['s'] = aToken.sentence_id_id
	# 		if aToken.sequence_in_sentence:
	# 			aTokenset['sr'] = aToken.sequence_in_sentence
	# 		if aToken.fragment_of_id:
	# 			aTokenset['fo'] = aToken.fragment_of_id
	# 		if aToken.likely_error:
	# 			aTokenset['le'] = 1
	# 		aTokens[aToken.pk] = aTokenset
	# 	return httpOutput(json.dumps({'aTokenTypes': aTokenTypes, 'aSaetze': aSaetze, 'aEvents': aEvents, 'aInformanten': aInformanten, 'aTokens': aTokens}), 'application/json')
	print(request.POST)
	if 'getMenue' in request.POST:
		if 'ainformant' in request.POST:
			ipk = int(request.POST.get('ainformant'))
		informantenMitTranskripte = [{'model': {'pk': val.pk, 'model_str': str(val)}, 'Acount': len(adbmodels.transcript.objects.filter(token__ID_Inf=val.pk).values('id').annotate(total=Count('id')))} for val in dbmodels.Informanten.objects.all()]
		aTranskripte = []
		if ipk > 0:
			aTranskripte = [{'model': {'pk': val.pk, 'model_str': str(val), 'update_time': val.update_time.strftime("%d.%m.%Y- %H:%M"), 'name': val.name}, 'count': val.token_set.count()} for val in [adbmodels.transcript.objects.get(pk=atid['id']) for atid in adbmodels.transcript.objects.filter(token__ID_Inf=ipk).values('id').annotate(total=Count('id'))]]
		return httpOutput(json.dumps({'informantenMitTranskripte': informantenMitTranskripte, 'aInformant': ipk, 'aTranskripte': aTranskripte}), 'application/json')

	return render_to_response('AnnotationsDB/startvue.html', RequestContext(request))
