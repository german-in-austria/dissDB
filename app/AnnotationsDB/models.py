from django.db import models


class event(models.Model):
	start_time			= models.DurationField(																				  verbose_name="Start Zeit")
	end_time			= models.DurationField(																				  verbose_name="End Zeit")
	layer				= models.IntegerField(						  null=True												, verbose_name="Layer")
	def __str__(self):
		return "{} - {} bis {}".format(self.layer, self.start_time, self.end_time)
	class Meta:
		db_table = "event"
		verbose_name = "Event"
		verbose_name_plural = "Events"
		ordering = ('layer',)

class token(models.Model):
	text				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Das aktuelle Token Wort")
	token_type_id		= models.ForeignKey('token_type'			, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Token Type")
	ortho				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Ortho")
	ID_Inf				= models.ForeignKey('Datenbank.Informanten'	, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="ID Informant")
	fragment_of			= models.ForeignKey('token', related_name='rn_token_fragment_of', blank=True, null=True	, on_delete=models.SET_NULL	, verbose_name="Fragment von")
	token_id			= models.ForeignKey('token', related_name='rn_token_token_id', blank=True, null=True	, on_delete=models.SET_NULL	, verbose_name="Token ID")
	event_id			= models.ForeignKey('event', related_name='rn_token_event_id', blank=True, null=True	, on_delete=models.SET_NULL	, verbose_name="Event ID")
	start_timepoint		= models.DurationField(																				  verbose_name="Start Zeitpunkt")
	end_timepoint		= models.DurationField(																				  verbose_name="End Zeitpunkt")
	transcript_id		= models.ForeignKey('transcript'			, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Transcript ID")
	likely_error		= models.BooleanField(default=False																	, verbose_name="likely Fehler")
	sentence_id			= models.ForeignKey('Datenbank.Saetze'		, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Sentence ID")
	sequence_in_sentence= models.IntegerField(						  null=True												, verbose_name="sequence_in_sentence")
	text_in_ortho		= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Text in Ortho")
	def __str__(self):
		return "{}".format(self.text)
	class Meta:
		db_table = "token"
		verbose_name = "Token"
		verbose_name_plural = "Tokens"
		ordering = ('sequence_in_sentence',)

class token_type(models.Model):
	token_type_name		= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Token Typ Name")
	def __str__(self):
		return "{}".format(self.token_type_name)
	class Meta:
		db_table = "token_type"
		verbose_name = "Token Typ"
		verbose_name_plural = "Token Typen"
		ordering = ('id',)

class transcript(models.Model):
	name				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Name")
	update_time			= models.DateTimeField(																				  verbose_name="Update Zeit")
	def __str__(self):
		return "{} ({})".format(self.Name,self.update_date)
	class Meta:
		db_table = "transcript"
		verbose_name = "Transcript"
		verbose_name_plural = "Transcripte"
		ordering = ('id',)
