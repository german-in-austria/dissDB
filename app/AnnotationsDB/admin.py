from django.contrib import admin
from django.apps import apps

for model in apps.get_app_config('AnnotationsDB').models.items():
	admin.site.register(apps.get_model("AnnotationsDB", model[0]))
