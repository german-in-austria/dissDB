from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import sys, locale, os
import json
import time


class Command(BaseCommand):
	help = 'Auswertung XLS erstellen.'

	def add_arguments(self, parser):
		parser.add_argument('aTagEbene', nargs='+', type=int)

	def handle(self, *args, **options):
		print('auswertung_xls.py aufgerufen', options['aTagEbene'][0])
