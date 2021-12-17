from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import sys, locale, os
import json
import time
import datetime
from AnnotationsDB.views_transkript import views_transkript_data
import AnnotationsDB.models as adbmodels


class Command(BaseCommand):
	help = 'Transkripte XLS Dateien erstellen.'

	def handle(self, *args, **options):
		print('transkripte_xls.py aufgerufen')
		verzeichnis = settings.PRIVATE_STORAGE_ROOT
		for subdir in ['annotationsdb', 'transkript']:
			verzeichnis = os.path.join(verzeichnis, subdir)
			if not os.path.isdir(verzeichnis):
				os.mkdir(verzeichnis)
		for aT in adbmodels.transcript.objects.all():
			aTranskript = aT.pk
			aTranskriptName = (aT.name + '-' if aT.name else '') + str(aT.pk)
			print('XLS erstellung gestartet:', aTranskript, aTranskriptName)
			wb = views_transkript_data(aTranskript, aTranskriptName, True, True)
			dateiname = str(aTranskriptName) + '-' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S') + '.xls'
			wb.save(os.path.join(verzeichnis, dateiname))
			print('XLS erstellung fertig:', aTranskript, ' -> ', os.path.join(verzeichnis, dateiname), wb)
		print('transkripte_xls.py fertig')
