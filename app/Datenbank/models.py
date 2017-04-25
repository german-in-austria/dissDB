from django.db import models

class Antworten(models.Model):
	id_Antwort			= models.AutoField(primary_key=True																	, verbose_name="ID von Antwort")
	von_Inf				= models.ForeignKey('Informanten'									, on_delete=models.CASCADE		, verbose_name="von Informanten")
	zu_Aufgabe			= models.ForeignKey('Aufgaben',				blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="zu Aufgabe")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	ist_am				= models.ForeignKey('Antwortmöglichkeiten',	blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Ist Antwortmöglichkeit")
	ist_gewählt			= models.BooleanField(default=False																	, verbose_name="Ist gewählt")
	ist_nat				= models.BooleanField(default=False																	, verbose_name="Ist NAT")
	ist_Satz			= models.ForeignKey('Sätze',				blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Ist Satz")
	ist_bfl				= models.BooleanField(default=False																	, verbose_name="Ist BFL")
	bfl_durch_S			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="BFL durch S")
	start_Antwort		= models.DurationField(																				  verbose_name="Start Antwort")
	stop_Antwort		= models.DurationField(																				  verbose_name="Stop Antwort")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{}, {}".format(self.von_Inf,self.zu_Aufgabe)
	class Meta:
		db_table = "Antworten"
		verbose_name = "Antwort"
		verbose_name_plural = "Antworten"
		ordering = ('Reihung',)

class Antwortmöglichkeiten(models.Model):
	id_am				= models.AutoField(primary_key=True																	, verbose_name="ID Antwortmöglichkeit")
	zu_Aufgabe			= models.ForeignKey('Aufgaben'										, on_delete=models.CASCADE		, verbose_name="zu_Aufgabe")
	Kürzel				= models.CharField(max_length=45																	, verbose_name="Kürzel")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	frei				= models.BooleanField(default=False																	, verbose_name="Frei")
	def __str__(self):
		return "{}, {}".format(self.Kürzel,self.zu_Aufgabe)
	class Meta:
		db_table = "Antwortmöglichkeiten"
		verbose_name = "Antwortmöglichkeit"
		verbose_name_plural = "Antwortmöglichkeiten"
		ordering = ('Reihung',)

class Sätze(models.Model):
	id_Satz				= models.AutoField(primary_key=True																	, verbose_name="ID von Satz")
	Transkript			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Transkript")
	Standardorth		= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Standardorth")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{}, {} ({})".format(self.Transkript,self.Standardorth,self.Kommentar)
	class Meta:
		db_table = "Sätze"
		verbose_name = "Satz"
		verbose_name_plural = "Sätze"
		ordering = ('Transkript',)

class AntwortenTags(models.Model):
	id_Antwort			= models.ForeignKey('Antworten'										, on_delete=models.CASCADE		, verbose_name="ID zu Antwort")
	id_Tag				= models.ForeignKey('Tags'											, on_delete=models.CASCADE		, verbose_name="ID zu Tag")
	primär				= models.BooleanField(default=False																	, verbose_name="Primär")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	def __str__(self):
		return "{}<->{}".format(self.id_Antwort,self.id_Tag)
	class Meta:
		db_table = "AntwortenTags"
		verbose_name = "Antworten Tag"
		verbose_name_plural = "Antworten Tags"
		ordering = ('Reihung',)

class Tags(models.Model):
	id_tag				= models.AutoField(primary_key=True																	, verbose_name="ID von Tag")
	Tag					= models.CharField(max_length=45																	, verbose_name="Tag")
	Tag_lang			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Tag lang")
	zu_Tag				= models.ForeignKey('self',					blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Zu Tag")
	zu_Phänomen			= models.ForeignKey('Phänomene',			blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Zu Phänomen")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	AReihung			= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	def __str__(self):
		return "{}".format(self.Tag)
	class Meta:
		db_table = "Tags"
		verbose_name = "Tag"
		verbose_name_plural = "Tags"
		ordering = ('AReihung',)

class Phänomene(models.Model):
	id_Phänomen			= models.AutoField(primary_key=True																	, verbose_name="ID von Phänomen")
	Bez_Phänomen		= models.CharField(max_length=255																	, verbose_name="Bezeichnung Phänomen")
	Beschr_Phänomen		= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Beschreibung Phänomen")
	zu_PhänBer			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Zu Phänomenen Ber")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{}".format(self.Bez_Phänomen)
	class Meta:
		db_table = "Phänomene"
		verbose_name = "Phänomen"
		verbose_name_plural = "Phänomene"
		ordering = ('Bez_Phänomen',)

class Informanten(models.Model):
	id_Person			= models.AutoField(primary_key=True																	, verbose_name="ID von Informant")
	Kürzel				= models.CharField(max_length=45,			blank=True, null=True									, verbose_name="Kürzel")
	Kürzel_anonym		= models.CharField(max_length=45,			blank=True, null=True									, verbose_name="Kürzel Anonym")
	Name				= models.CharField(max_length=45,			blank=True, null=True									, verbose_name="Name")
	Vorname				= models.CharField(max_length=45,			blank=True, null=True									, verbose_name="Vorname")
	weiblich			= models.BooleanField(default=False,		blank=False 											, verbose_name="weiblich?")
	Geburtsdatum		= models.DateField(							blank=True, null=True									, verbose_name="Geburtsdatum")
	ErhAlterCa			= models.IntegerField(						blank=True, null=True									, verbose_name="ErhebungsalterCA")
	Wohnbezirk			= models.IntegerField(						blank=True, null=True									, verbose_name="Wohnbezirk")
	DialKomp			= models.IntegerField(						blank=True, null=True									, verbose_name="Dialektkompetenz")
	StandKomp			= models.IntegerField(						blank=True, null=True									, verbose_name="Standardkompetenz")
	ZwischKomp			= models.IntegerField(						blank=True, null=True									, verbose_name="Zwischenbereichkompetenz")
	GWPGruppe			= models.IntegerField(						blank=True, null=True									, verbose_name="GWP-Gruppe")


	def __str__(self):
		return "{} ({})".format(self.Kürzel,self.id_Person)
	class Meta:
		db_table = "Informanten"
		verbose_name = "Informant"
		verbose_name_plural = "Informanten"
		ordering = ('id_Person',)

class InfErhebung(models.Model):
	id_InfErh			= models.AutoField(primary_key=True																	, verbose_name="ID von InfErhebung")
	ID_Erh				= models.ForeignKey('Erhebungen'									, on_delete=models.CASCADE		, verbose_name="ID Erhebung")
	ID_Inf				= models.ForeignKey('Informanten'									, on_delete=models.CASCADE		, verbose_name="ID Informant")
	Datum				= models.DateField(																					  verbose_name="Datum")
	Explorator			= models.IntegerField(																				  verbose_name="Explorator")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	Dateipfad			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Verzeichniss für Dateien")
	Audiofile			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Audiofile")
	Logfile				= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Logfile")
	Ort					= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Ort")
	Besonderheiten		= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Besonderheiten")
	def __str__(self):
		return "{} {}<->{}".format(self.Datum,self.ID_Erh,self.ID_Inf)
	class Meta:
		db_table = "InfErhebung"
		verbose_name = "InfErhebung"
		verbose_name_plural = "InfErhebungen"
		ordering = ('Datum',)

class ErhInfAufgaben(models.Model):
	id_InfErh			= models.ForeignKey('InfErhebung'									, on_delete=models.CASCADE		, verbose_name="ID InfErhebung")
	id_Aufgabe			= models.ForeignKey('Aufgaben'										, on_delete=models.CASCADE		, verbose_name="ID Aufgaben")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	start_Aufgabe		= models.DurationField(																				  verbose_name="Start Aufgabe")
	stop_Aufgabe		= models.DurationField(																				  verbose_name="Stop Aufgabe")
	first_click			= models.DurationField(																				  verbose_name="First Click")
	def __str__(self):
		return "{}<->{}".format(self.id_InfErh,self.id_Aufgabe)
	class Meta:
		db_table = "ErhInfAufgaben"
		verbose_name = "ErhInfAufgabe"
		verbose_name_plural = "ErhInfAufgaben"
		ordering = ('Reihung',)

class Erhebungen(models.Model):
	id_Erhebung			= models.AutoField(primary_key=True																	, verbose_name="ID von Erhebung")
	Art_Erhebung		= models.IntegerField(						blank=True, null=True									, verbose_name="Art der Erhebung")
	Bezeichnung_Erhebung= models.CharField(max_length=255																	, verbose_name="Bezeichnung der Erhebung")
	Zeitraum			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Zeitraum")
	Konzept_von			= models.IntegerField(						blank=True, null=True									, verbose_name="Konzept von")
	def __str__(self):
		return "{}".format(self.Bezeichnung_Erhebung)
	class Meta:
		db_table = "Erhebungen"
		verbose_name = "Erhebung"
		verbose_name_plural = "Erhebungen"
		ordering = ('Bezeichnung_Erhebung',)

class Erhebung_mit_Aufgaben(models.Model):
	id_ErhA				= models.AutoField(primary_key=True																	, verbose_name="ID von Erhebung_mit_Aufgaben")
	id_Erh				= models.ForeignKey('Erhebungen'									, on_delete=models.CASCADE		, verbose_name="von Erhebungen")
	id_Aufgabe			= models.ForeignKey('Aufgaben',				blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="zu Aufgabe")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	ist_randomisiert	= models.BooleanField(default=False																	, verbose_name="Ist Randomisiert")
	def __str__(self):
		return "{}<->{}".format(self.id_Erh,self.id_Aufgabe)
	class Meta:
		db_table = "Erhebung_mit_Aufgaben"
		verbose_name = "Erhebung mit Aufgaben"
		verbose_name_plural = "Erhebungen mit Aufgaben"
		ordering = ('Reihung',)

class Aufgaben(models.Model):
	id_Aufgabe			= models.AutoField(primary_key=True																	, verbose_name="ID von Aufgabe")
	von_ASet			= models.ForeignKey('Aufgabensets'									, on_delete=models.CASCADE		, verbose_name="von Aufgabensets")
	Variante			= models.IntegerField(																				  verbose_name="Variante")
	ist_dialekt			= models.BooleanField(default=False																	, verbose_name="Ist Dialekt")
	Beschreibung_Aufgabe= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Beschreibung Aufgabe")
	def __str__(self):
		return "{} - {} ({})".format(self.Variante,self.Beschreibung_Aufgabe,self.von_ASet)
	class Meta:
		db_table = "Aufgaben"
		verbose_name = "Aufgabe"
		verbose_name_plural = "Aufgaben"
		ordering = ('von_ASet',)

class Aufgabensets(models.Model):
	id_Aufgabe			= models.AutoField(primary_key=True																	, verbose_name="ID von Aufgabenset")
	Kürzel				= models.CharField(max_length=45																	, verbose_name="Kürzel")
	Name_Aset			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Name Aufgabenset")
	Fokus				= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Fokus")
	zu_Phänomen			= models.ForeignKey('Phänomene',			blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Zu Phänomen")
	Art_ASet			= models.IntegerField(						blank=True, null=True									, verbose_name="Art Aufgabenset")
	zusammengestellt_als= models.ForeignKey('Aufgabenzusammenstellungen',blank=True, null=True	, on_delete=models.SET_NULL	, verbose_name="Zusammengestellt als")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{} ({})".format(self.Kürzel,self.Art_ASet)
	class Meta:
		db_table = "Aufgabensets"
		verbose_name = "Aufgabenset"
		verbose_name_plural = "Aufgabensets"
		ordering = ('Kürzel',)

class Aufgabenzusammenstellungen(models.Model):
	id_AZus				= models.AutoField(primary_key=True																	, verbose_name="ID von Aufgabenzusammenstellung")
	Bezeichnung_AZus	= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Bezeichnung")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	AZusCol				= models.CharField(max_length=45,			blank=True, null=True									, verbose_name="AZus Col")
	def __str__(self):
		return "{} ({})".format(self.Bezeichnung_AZus,self.AZusCol)
	class Meta:
		db_table = "Aufgabenzusammenstellungen"
		verbose_name = "Aufgabenzusammenstellung"
		verbose_name_plural = "Aufgabenzusammenstellungen"
		ordering = ('Bezeichnung_AZus',)

class AZusBeinhaltetMedien(models.Model):
	id_AZusMed			= models.AutoField(primary_key=True																	, verbose_name="ID von Aufgabenzusammenstellung")
	id_AZus				= models.ForeignKey('Aufgabenzusammenstellungen'					, on_delete=models.CASCADE		, verbose_name="von AZus")
	id_Mediatyp			= models.ForeignKey('Mediatypen'									, on_delete=models.CASCADE		, verbose_name="von Mediatyp")
	Reihung				= models.CharField(max_length=45,																	  verbose_name="Reihung")
	def __str__(self):
		return "{}<->{}".format(self.id_AZus,self.id_Mediatyp)
	class Meta:
		db_table = "AZusBeinhaltetMedien"
		verbose_name = "AZusBeinhaltetMedien"
		verbose_name_plural = "AZusBeinhaltetMedien"
		ordering = ('Reihung',)

class Aufgabenfiles(models.Model):
	id_Afiles			= models.AutoField(primary_key=True																	, verbose_name="ID von Aufgabenfile")
	id_Aufgabe			= models.ForeignKey('Aufgaben'										, on_delete=models.CASCADE		, verbose_name="von Aufgaben")
	id_Mediatyp			= models.ForeignKey('Mediatypen'									, on_delete=models.CASCADE		, verbose_name="von Mediatyp")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	ist_Anweisung		= models.BooleanField(default=False																	, verbose_name="Ist Anweisung")
	File_Link			= models.CharField(max_length=45,																	  verbose_name="File Link")
	Kommentar			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{}<->{}".format(self.id_Aufgabe,self.id_Mediatyp)
	class Meta:
		db_table = "Aufgabenfiles"
		verbose_name = "Aufgabenfile"
		verbose_name_plural = "Aufgabenfiles"
		ordering = ('Reihung',)

class Mediatypen(models.Model):
	id_Mediatyp			= models.AutoField(primary_key=True																	, verbose_name="ID von Mediatyp")
	Bezeichnung			= models.CharField(max_length=45																	, verbose_name="Bezeichnung")
	Filetypes			= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Filetypes")
	def __str__(self):
		return "{} ({})".format(self.Bezeichnung,self.Filetypes)
	class Meta:
		db_table = "Mediatypen"
		verbose_name = "Mediatyp"
		verbose_name_plural = "Mediatypen"
		ordering = ('Bezeichnung',)
