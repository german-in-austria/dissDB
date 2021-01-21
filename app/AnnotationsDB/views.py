from django.shortcuts import render_to_response, redirect
from django.template import RequestContext


def auswertung(request, aTagEbene, aSeite):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	from .views_auswertung import views_auswertung
	return views_auswertung(request, aTagEbene, aSeite)


def tagauswertung(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	from .views_tagauswertung import views_tagauswertung
	return views_tagauswertung(request)


def startvue(request, ipk=0, tpk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	from .views_tooljson import views_tooljson
	return views_tooljson(request, ipk, tpk)


def annotool(request, ipk=0, tpk=0):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	from .views_annotool import views_annotool
	return views_annotool(request, ipk, tpk)


def tool(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	return render_to_response('AnnotationsDB/toolstart.html', RequestContext(request))


def annosent(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	from .views_annosent import views_annosent
	return views_annosent(request)


def annocheck(request):
	# Ist der User Angemeldet?
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	from .views_annocheck import views_annocheck
	return views_annocheck(request)
