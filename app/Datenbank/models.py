from django.db import models
import time
import datetime

class Antworten(models.Model):
	von_Inf				= models.ForeignKey('Informanten'									, on_delete=models.CASCADE		, verbose_name="von Informanten")
	zu_Aufgabe			= models.ForeignKey('Aufgaben'				, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="zu Aufgabe")
	Reihung				= models.IntegerField(						  blank=True, null=True									, verbose_name="Reihung")
	ist_am				= models.ForeignKey('Antwortmoeglichkeiten'	, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Ist Antwortmöglichkeit")
	ist_gewaehlt		= models.BooleanField(default=False																	, verbose_name="Ist gewählt")
	ist_nat				= models.BooleanField(default=False																	, verbose_name="Ist NAT")
	ist_Satz			= models.ForeignKey('Saetze'				, blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Ist Satz")
	ist_bfl				= models.BooleanField(default=False																	, verbose_name="Ist BFL")
	ist_token			= models.ForeignKey('AnnotationsDB.token', blank=True, null=True, on_delete=models.SET_NULL		, verbose_name="Ist Token")
	ist_tokenset		= models.ForeignKey('AnnotationsDB.tbl_tokenset', blank=True, null=True	, on_delete=models.SET_NULL	, verbose_name="Ist Tokenset")
	bfl_durch_S			= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="BFL durch S")
	start_Antwort		= models.DurationField(																				  verbose_name="Start Antwort")
	stop_Antwort		= models.DurationField(																				  verbose_name="Stop Antwort")
	Kommentar			= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{}, {}".format(self.von_Inf,self.zu_Aufgabe)
	class Meta:
		db_table = "Antworten"
		verbose_name = "Antwort"
		verbose_name_plural = "Antworten"
		ordering = ('Reihung',)

class Antwortmoeglichkeiten(models.Model):
	zu_Aufgabe			= models.ForeignKey('Aufgaben'										, on_delete=models.CASCADE		, verbose_name="zu_Aufgabe")
	Kuerzel				= models.CharField(max_length=255																	, verbose_name="Kürzel")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	frei				= models.BooleanField(default=False																	, verbose_name="Frei")
	def __str__(self):
		return "{}, {}".format(self.Kuerzel,self.zu_Aufgabe)
	class Meta:
		db_table = "Antwortmoeglichkeiten"
		verbose_name = "Antwortmöglichkeit"
		verbose_name_plural = "Antwortmöglichkeiten"
		ordering = ('Reihung',)

class Saetze(models.Model):
	Transkript			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Transkript")
	Standardorth		= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Standardorth")
	Kommentar			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Kommentar")
	svgfilename			= models.CharField(max_length=511			, blank=True, null=True									, verbose_name="Displacy SVG Filename")
	def __str__(self):
		return "{}, {} ({})".format(self.Transkript,self.Standardorth,self.Kommentar)
	class Meta:
		db_table = "Saetze"
		verbose_name = "Satz"
		verbose_name_plural = "Sätze"
		ordering = ('Transkript',)

class AntwortenTags(models.Model):
	id_Antwort			= models.ForeignKey('Antworten'										, on_delete=models.CASCADE		, verbose_name="ID zu Antwort")
	id_Tag				= models.ForeignKey('Tags'											, on_delete=models.CASCADE		, verbose_name="ID zu Tag")
	id_TagEbene			= models.ForeignKey('TagEbene',				blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="ID zu Tag Ebene")
	# primaer löschen!
	primaer				= models.BooleanField(default=False																	, verbose_name="Primär")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	def __str__(self):
		return "{} <-> {}".format(self.id_Antwort,self.id_Tag)
	class Meta:
		db_table = "AntwortenTags"
		verbose_name = "Antworten Tag"
		verbose_name_plural = "Antworten Tags"
		ordering = ('Reihung',)

class TagEbene(models.Model):
	Name				= models.CharField(max_length=255																	, verbose_name="Name")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	def __str__(self):
		return "{}".format(self.Name)
	class Meta:
		db_table = "TagEbene"
		verbose_name = "Tag Ebene"
		verbose_name_plural = "Tag Ebenen"
		ordering = ('Reihung',)

class TagEbeneZuTag(models.Model):
	id_TagEbene			= models.ForeignKey('TagEbene'										, on_delete=models.CASCADE		, verbose_name="ID zu Tag Ebene")
	id_Tag				= models.ForeignKey('Tags'											, on_delete=models.CASCADE		, verbose_name="ID zu Tag")
	def __str__(self):
		return "{} <- {}".format(self.id_TagEbene,self.id_Tag)
	class Meta:
		db_table = "TagEbeneZuTag"
		verbose_name = "Tag Ebene zu Tag"
		verbose_name_plural = "Tag Ebenen zu Tags"
		ordering = ('id_TagEbene',)

class Tags(models.Model):
	Tag					= models.CharField(max_length=255																	, verbose_name="Tag")
	Tag_lang			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Tag lang")
	# zu_Tag löschen!
	zu_Tag				= models.ForeignKey('self',					blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Zu Tag")
	zu_Phaenomen		= models.ForeignKey('Phaenomene',			blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Zu Phänomen")
	Kommentar			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Kommentar")
	AReihung			= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	Generation			= models.IntegerField(choices=[(i, i) for i in range(0, 10)], blank=True, null=True					, verbose_name="Generation")
	def kategorienListeFX(amodel,suche,inhalt,mitInhalt,arequest,ausgabe):
		from django.shortcuts import render_to_response
		from django.template import RequestContext
		from DB.funktionenDB import kategorienListe
		if not inhalt:
			aElement = amodel.objects.all()
			ausgabe['tagsAll']={'count':aElement.count(),'title':'TAGS - Alle','enthaelt':1}
			if mitInhalt>0:
				ausgabe['tagsAll']['active'] = render_to_response('DB/lmfadl.html',
					RequestContext(arequest, {'lmfadl':kategorienListe(amodel,inhalt='tagsAll'),'openpk':mitInhalt,'scrollto':mitInhalt}),).content
			aElement = amodel.objects.filter(id_ChildTag=None).exclude(id_ParentTag=None)
			ausgabe['tagsParentsWithChilds']={'count':aElement.count(),'title':'TAGS - Eltern mit Kindern'}
			aElement = amodel.objects.exclude(id_ChildTag=None).exclude(id_ParentTag=None)
			ausgabe['tagsChildsWithChilds']={'count':aElement.count(),'title':'TAGS - Kinder mit Kindern'}
			aElement = amodel.objects.filter(id_ParentTag=None).exclude(id_ChildTag=None)
			ausgabe['tagsChildsWithoutChilds']={'count':aElement.count(),'title':'TAGS - Kinder ohne Kinder'}
			aElement = amodel.objects.filter(id_ChildTag=None,id_ParentTag=None)
			ausgabe['tagsStandalone']={'count':aElement.count(),'title':'TAGS - Einzelgänger'}
			return ausgabe
		else:
			if inhalt == 'tagsParentsWithChilds':
				return [{'model':aM,'title':str(aM)+((' ('+str(aM.Tag_lang)+')') if aM.Tag_lang else '')} for aM in amodel.objects.filter(id_ChildTag=None).exclude(id_ParentTag=None).order_by('Tag')]
			if inhalt == 'tagsChildsWithChilds':
				return [{'model':aM,'title':str(aM)+((' ('+str(aM.Tag_lang)+')') if aM.Tag_lang else '')} for aM in amodel.objects.exclude(id_ChildTag=None).exclude(id_ParentTag=None).order_by('Tag')]
			if inhalt == 'tagsChildsWithoutChilds':
				return [{'model':aM,'title':str(aM)+((' ('+str(aM.Tag_lang)+')') if aM.Tag_lang else '')} for aM in amodel.objects.filter(id_ParentTag=None).exclude(id_ChildTag=None).order_by('Tag')]
			if inhalt == 'tagsStandalone':
				return [{'model':aM,'title':str(aM)+((' ('+str(aM.Tag_lang)+')') if aM.Tag_lang else '')} for aM in amodel.objects.filter(id_ChildTag=None,id_ParentTag=None).order_by('Tag')]
			return [{'model':aM,'title':str(aM)+((' <span style="font-size:13px;">('+str(aM.Tag_lang)+')</span>') if aM.Tag_lang else '')} for aM in amodel.objects.all().order_by('Tag')]
	def __str__(self):
		return "{} ({}, {})".format(self.Tag,self.Generation,self.zu_Phaenomen)
	class Meta:
		db_table = "Tags"
		verbose_name = "Tag"
		verbose_name_plural = "Tags"
		ordering = ('AReihung','Tag')

class TagFamilie(models.Model):
	id_ParentTag		= models.ForeignKey('Tags', related_name='id_ParentTag'				, on_delete=models.CASCADE		, verbose_name="Parent ID zu Tag")
	id_ChildTag			= models.ForeignKey('Tags', related_name='id_ChildTag'				, on_delete=models.CASCADE		, verbose_name="Child ID zu Tag")
	def __str__(self):
		return "{} <- {}".format(self.id_ParentTag,self.id_ChildTag)
	class Meta:
		db_table = "TagFamilie"
		verbose_name = "Tag Familie"
		verbose_name_plural = "Tag Familien"
		ordering = ('id_ParentTag',)

class Phaenomene(models.Model):
	Bez_Phaenomen		= models.CharField(max_length=511																	, verbose_name="Bezeichnung Phänomen")
	Beschr_Phaenomen	= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Beschreibung Phänomen")
	zu_PhaenBer			= models.IntegerField(						blank=True, null=True									, verbose_name="Zu Phänomenen Ber")
	Kommentar			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{} ({})".format(self.Bez_Phaenomen,self.zu_PhaenBer)
	class Meta:
		db_table = "Phaenomene"
		verbose_name = "Phänomen"
		verbose_name_plural = "Phänomene"
		ordering = ('Bez_Phaenomen',)

class Phaenomenbereich(models.Model):
	Bez_Phaenomenbereich		= models.CharField(max_length=511																	, verbose_name="Bezeichnung Phänomenbereich")
	def __str__(self):
		return "{}".format(self.Bez_Phaenomen)
	class Meta:
		db_table = "Phaenomenbereich"
		verbose_name = "Phänomenbereich"
		verbose_name_plural = "Phänomenbereiche"
		ordering = ('Bez_Phaenomenbereich',)

class Informanten(models.Model):
	Kuerzel				= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kürzel")
	Kuerzel_anonym		= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Kürzel Anonym")
	Name				= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Name")
	Vorname				= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="Vorname")
	weiblich			= models.BooleanField(default=False,		blank=False 											, verbose_name="weiblich?")
	Geburtsdatum		= models.DateField(							blank=True, null=True									, verbose_name="Geburtsdatum")
	ErhAlterCa			= models.IntegerField(						blank=True, null=True									, verbose_name="ErhebungsalterCA")
	Wohnbezirk			= models.IntegerField(						blank=True, null=True									, verbose_name="Wohnbezirk")
	DialKomp			= models.IntegerField(						blank=True, null=True									, verbose_name="Dialektkompetenz")
	StandKomp			= models.IntegerField(						blank=True, null=True									, verbose_name="Standardkompetenz")
	ZwischKomp			= models.IntegerField(						blank=True, null=True									, verbose_name="Zwischenbereichkompetenz")
	GWPGruppe			= models.IntegerField(						blank=True, null=True									, verbose_name="GWP-Gruppe")


	def __str__(self):
		return "{} ({})".format(self.Kuerzel,self.id)
	class Meta:
		db_table = "Informanten"
		verbose_name = "Informant"
		verbose_name_plural = "Informanten"
		ordering = ('id',)

class EinzelErhebung(models.Model):
	ID_Erh				= models.ForeignKey('Erhebungen'									, on_delete=models.CASCADE		, verbose_name="ID Erhebung")
	id_transcript		= models.ForeignKey('AnnotationsDB.transcript', blank=True, null=True, on_delete=models.SET_NULL	, verbose_name="ID Transkript")
	Datum				= models.DateField(																					  verbose_name="Datum")
	Explorator			= models.IntegerField(																				  verbose_name="Explorator")
	Kommentar			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Kommentar")
	Dateipfad			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Verzeichniss für Dateien")
	Audiofile			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Audiofile")
	Logfile				= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Logfile")
	Ort					= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Ort")
	Besonderheiten		= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Besonderheiten")
	mikrofon			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Mikrofon")
	setting				= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Setting")
	aufnhzeitpunkt		= models.DateTimeField(blank=True, null=True														, verbose_name="Aufnahmezeitpunkt")
	audiofilesize		= models.IntegerField(blank=True, null=True															, verbose_name="audiofilesize")
	dauer				= models.DurationField(blank=True, null=True														, verbose_name="Dauer")
	dateidauer			= models.DurationField(blank=True, null=True														, verbose_name="Dauer der Datei")
	plz					= models.IntegerField(blank=True, null=True															, verbose_name="plz")

	def getDuration():
		import mutagen
		from django.conf import settings
		import sys, locale, os
		dg = 0
		all = EinzelErhebung.objects.filter(dateidauer=None).count()
		for aEinzelErhebung in EinzelErhebung.objects.filter(dateidauer=None):
			start = time.time()
			if aEinzelErhebung.Dateipfad:
				aDir = settings.AUDIO_ROOT
				for sDir in aEinzelErhebung.Dateipfad.strip('\\').split('\\'):
					aDir = os.path.join(aDir, sDir)
				aDir = os.path.join(aDir, aEinzelErhebung.Audiofile + '.ogg')
				# print(aDir, os.path.isfile(aDir))
				if os.path.isfile(aDir):
					aFile = mutagen.File(aDir)
					if aFile.info.length > 0:
						print(aFile, aFile.info.length)
						aEinzelErhebung.dateidauer = datetime.timedelta(seconds=aFile.info.length)
						aEinzelErhebung.save()
						print(dg, '/', all, 'pk:', aEinzelErhebung.pk, 'dateidauer:', aEinzelErhebung.dateidauer, 'Timer:', time.time() - start)
			dg += 1
			# print(dg, '/', all, 'pk:', aEinzelErhebung.pk, 'dauer:', aEinzelErhebung.dateidauer, 'Timer:', time.time() - start)
		return dg

	def __str__(self):
		return "{} {} <-> {}".format(self.Datum, self.ID_Erh, ",".join([str(ize.ID_Inf) for ize in self.inf_zu_erhebung_set.all()]))
	class Meta:
		db_table = "EinzelErhebung"
		verbose_name = "Einzel Erhebung"
		verbose_name_plural = "Einzel Erhebungen"
		ordering = ('Datum',)

class Inf_zu_Erhebung(models.Model):
	ID_Inf				= models.ForeignKey('Informanten'									, on_delete=models.CASCADE		, verbose_name="Zu Informant")
	id_einzelerhebung	= models.ForeignKey('EinzelErhebung'								, on_delete=models.CASCADE		, verbose_name="zu EinzelErhebung")
	def __str__(self):
		return "{}<->{}".format(self.ID_Inf,self.id_einzelerhebung)
	class Meta:
		db_table = "Inf_zu_Erhebung"
		verbose_name = "Informant zu Erhebung"
		verbose_name_plural = "Informanten zu Erhebungen"
		ordering = ('ID_Inf',)

class ErhInfAufgaben(models.Model):
	id_InfErh			= models.ForeignKey('EinzelErhebung'								, on_delete=models.CASCADE		, verbose_name="ID EinzelErhebung")
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
	Art_Erhebung		= models.IntegerField(						blank=True, null=True									, verbose_name="Art der Erhebung")
	Bezeichnung_Erhebung= models.CharField(max_length=511																	, verbose_name="Bezeichnung der Erhebung")
	Zeitraum			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Zeitraum")
	Konzept_von			= models.IntegerField(						blank=True, null=True									, verbose_name="Konzept von")
	def __str__(self):
		return "{}".format(self.Bezeichnung_Erhebung)
	class Meta:
		db_table = "Erhebungen"
		verbose_name = "Erhebung"
		verbose_name_plural = "Erhebungen"
		ordering = ('Bezeichnung_Erhebung',)

class Erhebung_mit_Aufgaben(models.Model):
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
	von_ASet			= models.ForeignKey('Aufgabensets'									, on_delete=models.CASCADE		, verbose_name="von Aufgabensets")
	Variante			= models.IntegerField(																				  verbose_name="Variante")
	ist_dialekt			= models.BooleanField(default=False																	, verbose_name="Ist Dialekt")
	Beschreibung_Aufgabe= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Beschreibung Aufgabe")
	def __str__(self):
		return "{} - {} ({})".format(self.Variante,self.Beschreibung_Aufgabe,self.von_ASet)
	class Meta:
		db_table = "Aufgaben"
		verbose_name = "Aufgabe"
		verbose_name_plural = "Aufgaben"
		ordering = ('von_ASet',)

class Aufgabensets(models.Model):
	Kuerzel				= models.CharField(max_length=255																	, verbose_name="Kürzel")
	Name_Aset			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Name Aufgabenset")
	Fokus				= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Fokus")
	zu_Phaenomen		= models.ForeignKey('Phaenomene',			blank=True, null=True	, on_delete=models.SET_NULL		, verbose_name="Zu Phänomen")
	Art_ASet			= models.IntegerField(						blank=True, null=True									, verbose_name="Art Aufgabenset")
	zusammengestellt_als= models.ForeignKey('Aufgabenzusammenstellungen',blank=True, null=True	, on_delete=models.SET_NULL	, verbose_name="Zusammengestellt als")
	Kommentar			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{} ({})".format(self.Kuerzel,self.Art_ASet)
	class Meta:
		db_table = "Aufgabensets"
		verbose_name = "Aufgabenset"
		verbose_name_plural = "Aufgabensets"
		ordering = ('Kuerzel',)

class Aufgabenzusammenstellungen(models.Model):
	Bezeichnung_AZus	= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Bezeichnung")
	Kommentar			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Kommentar")
	AZusCol				= models.CharField(max_length=255,			blank=True, null=True									, verbose_name="AZus Col")
	def __str__(self):
		return "{} ({})".format(self.Bezeichnung_AZus,self.AZusCol)
	class Meta:
		db_table = "Aufgabenzusammenstellungen"
		verbose_name = "Aufgabenzusammenstellung"
		verbose_name_plural = "Aufgabenzusammenstellungen"
		ordering = ('Bezeichnung_AZus',)

class AZusBeinhaltetMedien(models.Model):
	id_AZus				= models.ForeignKey('Aufgabenzusammenstellungen'					, on_delete=models.CASCADE		, verbose_name="von AZus")
	id_Mediatyp			= models.ForeignKey('Mediatypen'									, on_delete=models.CASCADE		, verbose_name="von Mediatyp")
	Reihung				= models.CharField(max_length=255,																	  verbose_name="Reihung")
	def __str__(self):
		return "{}<->{}".format(self.id_AZus,self.id_Mediatyp)
	class Meta:
		db_table = "AZusBeinhaltetMedien"
		verbose_name = "AZusBeinhaltetMedien"
		verbose_name_plural = "AZusBeinhaltetMedien"
		ordering = ('Reihung',)

class Aufgabenfiles(models.Model):
	id_Aufgabe			= models.ForeignKey('Aufgaben'										, on_delete=models.CASCADE		, verbose_name="von Aufgaben")
	id_Mediatyp			= models.ForeignKey('Mediatypen'									, on_delete=models.CASCADE		, verbose_name="von Mediatyp")
	Reihung				= models.IntegerField(						blank=True, null=True									, verbose_name="Reihung")
	ist_Anweisung		= models.BooleanField(default=False																	, verbose_name="Ist Anweisung")
	File_Link			= models.CharField(max_length=255,																	  verbose_name="File Link")
	Kommentar			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Kommentar")
	def __str__(self):
		return "{}<->{}".format(self.id_Aufgabe,self.id_Mediatyp)
	class Meta:
		db_table = "Aufgabenfiles"
		verbose_name = "Aufgabenfile"
		verbose_name_plural = "Aufgabenfiles"
		ordering = ('Reihung',)

class Mediatypen(models.Model):
	Bezeichnung			= models.CharField(max_length=255																	, verbose_name="Bezeichnung")
	Filetypes			= models.CharField(max_length=511,			blank=True, null=True									, verbose_name="Filetypes")
	def __str__(self):
		return "{} ({})".format(self.Bezeichnung,self.Filetypes)
	class Meta:
		db_table = "Mediatypen"
		verbose_name = "Mediatyp"
		verbose_name_plural = "Mediatypen"
		ordering = ('Bezeichnung',)
