# -*- coding: utf-8 -*-
from django.db import models


# Create your models here.
class sys_diagramm_tabellenpositionen(models.Model):
	zu_app			= models.CharField(max_length=255																		, verbose_name="Zu App")
	zu_model		= models.CharField(max_length=255																		, verbose_name="Zu Model")
	xt				= models.IntegerField(																					  verbose_name="xt")
	yt				= models.IntegerField(																					  verbose_name="yt")

	def __str__(self):
		return '{}->{}: {}x{}"'.format(self.zu_app, self.zu_model, self.xt, self.yt)

	class Meta:
		verbose_name = "Tabellenposition für Diagramm"
		verbose_name_plural = "Tabellenpositionen für Diagramm"
		ordering = ('zu_app', 'zu_model', 'xt', 'yt')
		default_permissions = ()
