from django.conf.urls import url
from . import views
from . import converter0

urlpatterns = [
	url(r'^tool/{0,1}$', views.tool, name='tool'),
	url(r'^startvue/{0,1}$', views.startvue, name='startvue'),
	url(r'^startvue/(?P<ipk>[A-ZÄÖÜa-zäöü0-9_]+)/(?P<tpk>[A-ZÄÖÜa-zäöü0-9_]+)/{0,1}$', views.startvue, name='startvue'),
	url(r'^annotool/{0,1}$', views.annotool, name='annotool'),
	url(r'^annotool/(?P<ipk>[A-ZÄÖÜa-zäöü0-9_]+)/(?P<tpk>[A-ZÄÖÜa-zäöü0-9_]+)/{0,1}$', views.annotool, name='annotool'),
	url(r'^auswertung/(?P<aTagEbene>[A-ZÄÖÜa-zäöü0-9_]+)/(?P<aSeite>[A-ZÄÖÜa-zäöü0-9_]+)/{0,1}$', views.auswertung, name='auswertung'),
	url(r'^transkript/(?P<aTranskript>[A-ZÄÖÜa-zäöü0-9_]+)/{0,1}$', views.transkript, name='transkript'),
	url(r'^annosent/{0,1}$', views.annosent, name='annosent'),
	url(r'^tagauswertung/{0,1}$', views.tagauswertung, name='tagauswertung'),
	url(r'^annocheck/{0,1}$', views.annocheck, name='annocheck'),
	url(r'^converter0/{0,1}$', converter0.view, name='converter0view'),
]
