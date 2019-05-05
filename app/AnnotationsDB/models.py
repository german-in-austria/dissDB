from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.db import transaction, connection
import datetime
import time


class event(models.Model):
	start_time			= models.DurationField(						  null=True												, verbose_name="Start Zeit")
	end_time			= models.DurationField(						  null=True												, verbose_name="End Zeit")
	layer				= models.IntegerField(						  null=True												, verbose_name="Layer")
	updated				= models.DateTimeField(auto_now=True																, verbose_name="Letztes Änderung")
	def __str__(self):
		return "{} - {} bis {}".format(self.layer, self.start_time, self.end_time)
	class Meta:
		db_table = "event"
		verbose_name = "Event"
		verbose_name_plural = "Events"
		ordering = ('start_time',)


class token(models.Model):
	text				= models.CharField(max_length=511																	, verbose_name="Das aktuelle Token")
	token_type_id		= models.ForeignKey('token_type'			, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Token Type")
	ortho				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Ortho")
	ID_Inf				= models.ForeignKey('Datenbank.Informanten'	, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="ID Informant")
	fragment_of			= models.ForeignKey('token', related_name='rn_token_fragment_of', blank=True, null=True, on_delete=models.SET_NULL, verbose_name="Fragment von")
	token_reihung		= models.IntegerField(						  null=True												, verbose_name="Token Reihung")
	event_id			= models.ForeignKey('event', related_name='rn_token_event_id', blank=True, null=True, on_delete=models.SET_NULL, verbose_name="Event ID")
	start_timepoint		= models.DurationField(						  null=True												, verbose_name="Start Zeitpunkt")
	end_timepoint		= models.DurationField(						  null=True												, verbose_name="End Zeitpunkt")
	transcript_id		= models.ForeignKey('transcript'			, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Transcript ID")
	likely_error		= models.BooleanField(default=False																	, verbose_name="Eventueller Fehler")
	sentence_id			= models.ForeignKey('Datenbank.Saetze'		, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Sentence ID")
	sequence_in_sentence = models.IntegerField(						  null=True												, verbose_name="sequence_in_sentence")
	text_in_ortho		= models.TextField(							  blank=True, null=True									, verbose_name="Text in Ortho")
	ttpos				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="TreeTagger POS")
	ttlemma				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="TreeTagger Lemma")
	ttcheckword			= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="TreeTagger Checkword")
	sppos				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Spacy POS")
	sptag				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Spacy Tag")
	splemma				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Spacy Lemma")
	spdep				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Spacy Dependency Relation")
	sphead				= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Spacy Dependency Relation")
	spenttype			= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Spacy Named Entity Type")
	updated				= models.DateTimeField(auto_now=True																, verbose_name="Letztes Änderung")
	def __str__(self):
		return "\"{}\"".format(self.text)
	class Meta:
		db_table = "token"
		verbose_name = "Token"
		verbose_name_plural = "Tokens"
		ordering = ('sentence_id', 'token_reihung',)


class token_type(models.Model):
	token_type_name		= models.CharField(max_length=511																	, verbose_name="Token Typ Name")
	updated				= models.DateTimeField(auto_now=True																, verbose_name="Letztes Änderung")
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
	updated				= models.DateTimeField(auto_now=True																, verbose_name="Letztes Änderung")
	default_tier		= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="default_tier")
	def __str__(self):
		return "{} ({})".format(self.name, self.update_time)
	class Meta:
		db_table = "transcript"
		verbose_name = "Transcript"
		verbose_name_plural = "Transcripte"
		ordering = ('id',)


class tbl_tokenset(models.Model):
	id_von_token		= models.ForeignKey('token', related_name='rn_id_von_token', blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Von Token ID")
	id_bis_token		= models.ForeignKey('token', related_name='rn_id_bis_token', blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Bis Token ID")
	updated				= models.DateTimeField(auto_now=True																				, verbose_name="Letztes Änderung")
	def __str__(self):
		return "{} - {}".format(self.id_von_token, self.id_bis_token)
	class Meta:
		db_table = "tokenset"
		verbose_name = "Token Set"
		verbose_name_plural = "Token Sets"
		ordering = ('id_von_token',)


class tbl_tokentoset(models.Model):
	id_tokenset			= models.ForeignKey('tbl_tokenset'									, on_delete=models.CASCADE		, verbose_name="Tokenset")
	id_token			= models.ForeignKey('token'											, on_delete=models.CASCADE		, verbose_name="Token")
	updated				= models.DateTimeField(auto_now=True																, verbose_name="Letztes Änderung")
	def __str__(self):
		return "{} <- {}".format(self.id_tokenset, self.id_token)
	class Meta:
		db_table = "tokentoset"
		verbose_name = "Token to Token Set"
		verbose_name_plural = "Token to Token Sets"
		ordering = ('id_tokenset',)


class mat_adhocsentences(models.Model):
	id					= models.AutoField(primary_key=True)
	adhoc_sentence		= models.BigIntegerField(					  null=True												, verbose_name="adhoc_sentence")
	tokenids			= ArrayField(models.IntegerField(			  null=True												, verbose_name="tokenids"))
	infid				= models.IntegerField(						  null=True												, verbose_name="infid")
	transid				= models.IntegerField(						  null=True												, verbose_name="transid")
	tokreih				= ArrayField(models.IntegerField(			  null=True												, verbose_name="tokreih"))
	seqsent				= ArrayField(models.IntegerField(			  null=True												, verbose_name="seqsent"))
	sentorig			= models.TextField(							  blank=True, null=True									, verbose_name="sentorig")
	sentorth			= models.TextField(							  blank=True, null=True									, verbose_name="sentorth")
	left_context		= models.TextField(							  blank=True, null=True									, verbose_name="left_context")
	senttext			= models.TextField(							  blank=True, null=True									, verbose_name="senttext")
	right_context		= models.TextField(							  blank=True, null=True									, verbose_name="right_context")
	sentttlemma			= models.TextField(							  blank=True, null=True									, verbose_name="sentttlemma")
	sentttpos			= models.TextField(							  blank=True, null=True									, verbose_name="sentttpos")
	sentsplemma			= models.TextField(							  blank=True, null=True									, verbose_name="sentsplemma")
	sentsppos			= models.TextField(							  blank=True, null=True									, verbose_name="sentsppos")
	sentsptag			= models.TextField(							  blank=True, null=True									, verbose_name="sentsptag")
	sentspdep			= models.TextField(							  blank=True, null=True									, verbose_name="sentspdep")
	sentspenttype		= models.TextField(							  blank=True, null=True									, verbose_name="sentspenttype")
	class Meta:
		db_table = "mat_adhocsentences"
		managed = False
		verbose_name = "mat_adhocsentences"
		verbose_name_plural = "mat_adhocsentences"
		ordering = ('adhoc_sentence',)


class tbl_refreshlog_mat_adhocsentences(models.Model):
	created_at			= models.DateTimeField(auto_now_add=True, db_index=True												, verbose_name="Erstellt")
	duration			= models.DurationField(																				  verbose_name="Dauer")
	def __str__(self):
		return "{} ({})".format(self.created_at, self.duration)
	@transaction.atomic
	def refresh():
		start_time = time.monotonic()
		with connection.cursor() as cursor:
			cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mat_adhocsentences")
		end_time = time.monotonic()
		tbl_refreshlog_mat_adhocsentences.objects.create(duration=datetime.timedelta(seconds=end_time - start_time))
		return end_time - start_time
	class Meta:
		db_table = "tbl_refreshlog_mat_adhocsentences"
		verbose_name = "tbl_refreshlog_mat_adhocsentences"
		verbose_name_plural = "tbl_refreshlog_mat_adhocsentences"
		ordering = ('created_at',)
