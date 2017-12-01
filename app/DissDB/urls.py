from django.conf.urls import include, url
from django.contrib import admin
from django.core.urlresolvers import reverse_lazy
from Startseite import views as Startseite_views
import private_storage.urls

urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'^login/$', 'django.contrib.auth.views.login', {'template_name': 'main/login.html'}, name='dissdb_login'),
    url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': reverse_lazy('Startseite:start')}, name='dissdb_logout'),
	url(r'^$', include('Startseite.urls', namespace='Startseite')),
    url(r'^db/', include('DB.urls', namespace='DB')),
	url(r'^plate/', include('django_spaghetti.urls')),
	url(r'^bearbeiten/', include('bearbeiten.urls', namespace='bearbeiten')),
	url(r'^tags/', include('tags.urls', namespace='tags')),
   	url(r'^sysstatus/{0,1}$', Startseite_views.sysStatusView, name='sysstatus'),
    url(r'^private-media/', include(private_storage.urls)),
]
