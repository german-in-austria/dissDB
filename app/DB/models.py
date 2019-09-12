# -*- coding: utf-8 -*-
from django.db import models
from django.contrib.auth.models import User, Group


class user_verzeichnis(models.Model):
	user				= models.ForeignKey(User											, on_delete=models.CASCADE		, verbose_name="ID zu User")
	Verzeichnis			= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Verzeichnis")
	RECHTE_DATEN = (
		(0, 'Keine'),
		(1, 'Anzeigen'),
		(2, 'Anzeigen | Dateien hochladen und löschen'),
		(3, 'Anzeigen | Dateien hochladen und löschen | Unterverzeichnisse erstellen und löschen'),
		(4, 'Anzeigen | Dateien hochladen und löschen | Unterverzeichnisse erstellen und rekursiv löschen'),
	)
	Rechte				= models.PositiveIntegerField(				blank=True, null=True, choices=RECHTE_DATEN				, verbose_name="Rechte")
	def __str__(self):
		return "{} -> {} ({})".format(self.user, self.Verzeichnis, self.Rechte)
	class Meta:
		verbose_name = "Zugriffsrecht für Verzeichnis"
		verbose_name_plural = "Zugriffsrechte für Verzeichnisse"
		ordering = ('user',)
		default_permissions = ()


class group_verzeichnis(models.Model):
	group				= models.ForeignKey(Group											, on_delete=models.CASCADE		, verbose_name="ID zu Gruppe")
	Verzeichnis			= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Verzeichnis")
	RECHTE_DATEN_G = (
		(0, 'Keine'),
		(1, 'Anzeigen'),
		(2, 'Anzeigen | Dateien hochladen und löschen'),
		(3, 'Anzeigen | Dateien hochladen und löschen | Unterverzeichnisse erstellen und löschen'),
		(4, 'Anzeigen | Dateien hochladen und löschen | Unterverzeichnisse erstellen und rekursiv löschen'),
	)
	Rechte				= models.PositiveIntegerField(				blank=True, null=True, choices=RECHTE_DATEN_G			, verbose_name="Rechte")
	def __str__(self):
		return "{} -> {} ({})".format(self.group, self.Verzeichnis, self.Rechte)
	class Meta:
		verbose_name = "Zugriffsrecht für Verzeichnis"
		verbose_name_plural = "Zugriffsrechte für Verzeichnisse"
		ordering = ('group',)
		default_permissions = ()


class sys_filesystem(models.Model):
	def __str__(self):
		return '{}'.format(self.pk)
	class Meta:
		verbose_name = "Dateisystem"
		verbose_name_plural = "Dateisysteme"
		default_permissions = ()


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
