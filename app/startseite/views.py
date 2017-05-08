from django.shortcuts import get_object_or_404 , render_to_response , redirect
from django.http import HttpResponseRedirect
from django.template import RequestContext, loader
import Datenbank.models as dbmodels
from django.db.models import Count

def start(request):
	if not request.user.is_authenticated():
		return redirect('dissdb_login')

	InformantenCount=dbmodels.Informanten.objects.all().count()
	Aufgabensets = [] ; allproz = 0 ; allprozdg = 0
	for val in dbmodels.Aufgabensets.objects.all():
		aSet = [] ; proz = 0 ; prozdg = 0
		for bval in val.aufgaben_set.all():
			try:
				aproz = (100/InformantenCount*dbmodels.Antworten.objects.filter(zu_Aufgabe=bval.pk).values('zu_Aufgabe').annotate(total=Count('von_Inf'))[0]['total'])
			except:
				aproz = 0
			aSet.append({'model':bval,'proz':aproz})
			proz+= aproz ; prozdg+= 1
		aproz = (proz/prozdg) if prozdg>0 else 0
		Aufgabensets.append({'model':val, 'proz': aproz, 'childs': aSet})
		allproz+= aproz
		allprozdg+= 1

	return render_to_response('startseite/start.html',
		RequestContext(request, {'Aufgabensets':Aufgabensets,'allproz':(allproz/allprozdg) if allproz>0 else 0}),)
