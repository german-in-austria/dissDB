from django.conf.urls import url
from . import views

urlpatterns = [
	url(r'^tool/{0,1}$', views.tool, name='tool'),
	url(r'^startvue/{0,1}$', views.startvue, name='startvue'),
	url(r'^startvue/(?P<ipk>[A-ZÄÖÜa-zäöü0-9_]+)/(?P<tpk>[A-ZÄÖÜa-zäöü0-9_]+)/{0,1}$', views.startvue, name='startvue'),
	url(r'^auswertung/(?P<aTagEbene>[A-ZÄÖÜa-zäöü0-9_]+)/(?P<aSeite>[A-ZÄÖÜa-zäöü0-9_]+)/{0,1}$', views.auswertung, name='auswertung'),
]
