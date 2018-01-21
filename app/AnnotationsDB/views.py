from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.db.models import Count
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels


def start(request, ipk=0, tpk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	# aFormular = 'AnnotationsDB/start_formular.html'
	test = ''
	error = ''
	ipk = int(ipk)
	tpk = int(tpk)

	if tpk > 0:
		aDataSet = []
		for aInf in adbmodels.token.objects.filter(transcript_id_id=tpk).values('ID_Inf').annotate(total=Count('ID_Inf')).order_by('ID_Inf'):
			aInf['model'] = dbmodels.Informanten.objects.get(id=aInf['ID_Inf'])
			aEventSet = []
			for aEvent in adbmodels.token.objects.filter(transcript_id_id=tpk, ID_Inf_id=aInf['ID_Inf']).values('event_id').annotate(total=Count('event_id')).order_by('event_id__start_time'):
				aEvent['model'] = adbmodels.event.objects.get(id=aEvent['event_id'])
				aEvent['token'] = adbmodels.token.objects.filter(event_id_id=aEvent['event_id']).order_by('token_reihung')
				aEventSet.append(aEvent)
			aInf['event'] = aEventSet
			aDataSet.append(aInf)
		return render_to_response(
			'AnnotationsDB/annotationstool.html',
			RequestContext(request, {'aDataSet': aDataSet, 'test': test}),)

	if 'ainformant' in request.POST:
		ipk = int(request.POST.get('ainformant'))

	informantenMitTranskripte = [{'model': val, 'Acount': len(adbmodels.transcript.objects.filter(token__ID_Inf=val).values('id').annotate(total=Count('id')))} for val in dbmodels.Informanten.objects.all()]
	aTranskripte = []
	if ipk > 0:
		aTranskripte = [{'model': val, 'count': val.token_set.count()} for val in [adbmodels.transcript.objects.get(pk=atid['id']) for atid in adbmodels.transcript.objects.filter(token__ID_Inf=ipk).values('id').annotate(total=Count('id'))]]

	return render_to_response(
		'AnnotationsDB/start.html',
		RequestContext(request, {'informantenMitTranskripte': informantenMitTranskripte, 'aInformant': ipk, 'aTranskripte': aTranskripte, 'test': test}),)
