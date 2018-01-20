from django.conf.urls import url
from . import views

urlpatterns = [
	url(r'^$', views.start, name='start'),
	url(r'^(?P<ipk>[A-ZÄÖÜa-zäöü0-9_]+)/(?P<apk>[A-ZÄÖÜa-zäöü0-9_]+)/{0,1}$', views.start, name='start'),
]
