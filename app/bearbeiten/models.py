from django.db import models
from sortedm2m.fields import SortedManyToManyField

class PresetTags(models.Model):
	id_Tags				= SortedManyToManyField('Datenbank.Tags'							                       		, verbose_name="IDs zu Tag")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	def __str__(self):
		return "{}. {}".format(self.Reihung,", ".join(p.Tag for p in self.id_Tags.all()))
	class Meta:
		verbose_name = "Preset Tags"
		verbose_name_plural = "Presets Tags"
		ordering = ('Reihung',)

class PresetTagsZuAufgabe(models.Model):
	id_PresetTags		= models.ForeignKey('PresetTags'									, on_delete=models.CASCADE		, verbose_name="ID zu PresetTags")
	id_Aufgabe			= models.ForeignKey('Datenbank.Aufgaben'							, on_delete=models.CASCADE		, verbose_name="ID Aufgaben")
	def __str__(self):
		return "{} <- {}".format(self.id_Aufgabe,self.id_PresetTags)
	class Meta:
		verbose_name = "Preset Tags"
		verbose_name_plural = "Presets Tags"
		ordering = ('id_Aufgabe',)
