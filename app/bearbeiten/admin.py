from django.contrib import admin
from django.apps import apps

for model in apps.get_app_config('bearbeiten').models.items():
	admin.site.register(apps.get_model("bearbeiten", model[0]))
