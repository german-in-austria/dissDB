from django.conf.urls import url
from . import views

urlpatterns = [
	url(r'^transcripts/{0,1}$', views.transcripts, name='transcripts'),
	url(r'^transcript/(?P<aPk>[0-9]+)/(?P<aNr>[0-9]+)/{0,1}$', views.transcript, name='transcript'),
]
