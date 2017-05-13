from django.conf.urls import url
from . import views

urlpatterns = [
	url(r'^$', views.start, name='start'),
	url(r'^tagsedit/{0,1}$', views.tagsedit, name='tagsedit'),
]
