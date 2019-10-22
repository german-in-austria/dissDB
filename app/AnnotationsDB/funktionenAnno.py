"""Funktionen die für diverse Tools der AnnotationsDB benötigt werden."""
import json
from DB.funktionenDB import httpOutput
from django.db import connection
import datetime


def annoDelTokenSet(aTokenSetId, adbmodels):
	"""Token Set löschen. (annoSent und annoCheck)."""
	aTokenSet = adbmodels.tbl_tokenset.objects.get(id=aTokenSetId)
	adbmodels.tbl_tokentoset.objects.filter(id_tokenset=aTokenSet).delete()
	aTokenSet.delete()
	return httpOutput(json.dumps({'OK': True}, 'application/json'))


def annoSaveTokenSet(aTokensIds, aTokenSetId, adbmodels):
	"""Token Set Speichern. (annoSent und annoCheck)."""
	if len(aTokensIds) < 1:
		return httpOutput(json.dumps({'error': 'Keine Tokens übergeben!'}, 'application/json'))
	with connection.cursor() as cursor:
		cursor.execute('''
			(
				SELECT "token"."id", "token"."token_reihung"
				FROM "token"
				WHERE ("token"."id" IN %s)
				ORDER BY "token"."token_reihung" ASC
				LIMIT 1
			) UNION ALL (
				SELECT "token"."id", "token"."token_reihung"
				FROM "token"
				WHERE ("token"."id" IN %s)
				ORDER BY "token"."token_reihung" DESC
				LIMIT 1
			)
		''', [tuple(aTokensIds), tuple(aTokensIds)])
		vTokenId, vTokenReihung = cursor.fetchone()
		bTokenId, bTokenReihung = cursor.fetchone()
	vTokenObj = adbmodels.token.objects.get(pk=vTokenId)
	vbTokenCount = adbmodels.token.objects.filter(ID_Inf_id=vTokenObj.ID_Inf_id, transcript_id_id=vTokenObj.transcript_id_id, token_reihung__gte=vTokenReihung, token_reihung__lte=bTokenReihung).order_by('token_reihung').count()
	# print(vTokenObj, vTokenId, bTokenId, len(aTokensIds), vbTokenCount)
	try:
		aTokenSet = adbmodels.tbl_tokenset.objects.get(id=aTokenSetId)
	except adbmodels.tbl_tokenset.DoesNotExist:
		aTokenSet = adbmodels.tbl_tokenset()
		aTokenSet.save()
	if len(aTokensIds) == vbTokenCount:		# Ist ein Token Set Bereich
		adbmodels.tbl_tokentoset.objects.filter(id_tokenset=aTokenSet).delete()
		aTokenSet.id_von_token = vTokenObj
		aTokenSet.id_bis_token_id = bTokenId
	else:									# Ist eine Token Set Liste
		aTokenSet.id_von_token_id = None
		aTokenSet.id_bis_token_id = None
		adbmodels.tbl_tokentoset.objects.filter(id_tokenset=aTokenSet).exclude(id_token__in=aTokensIds).delete()
		for aTokenId in aTokensIds:
			obj, created = adbmodels.tbl_tokentoset.objects.update_or_create(id_tokenset_id=aTokenSet.id, id_token_id=aTokenId, defaults={'id_tokenset_id': aTokenSet.id, 'id_token_id': aTokenId})
	aTokenSet.save()
	return httpOutput(json.dumps({'OK': True, 'tokenset_id': aTokenSet.id}, 'application/json'))


def annoSaveAntworten(sAntworten, adbmodels, dbmodels):
	"""Antworten mit Tags speichern/ändern/löschen. (annoSent und annoCheck)."""
	for sAntwort in sAntworten:
		print(json.dumps(sAntwort))
		if 'deleteIt' in sAntwort:
			if sAntwort['id'] > 0:
				aElement = dbmodels.Antworten.objects.get(id=sAntwort['id'])
				aElement.delete()
		else:
			if sAntwort['id'] > 0:
				aElement = dbmodels.Antworten.objects.get(id=sAntwort['id'])
			else:
				aElement = dbmodels.Antworten()
				setattr(aElement, 'start_Antwort', datetime.timedelta(microseconds=0))
				setattr(aElement, 'stop_Antwort', datetime.timedelta(microseconds=0))
			setattr(aElement, 'von_Inf_id', (sAntwort['von_Inf_id'] if 'von_Inf_id' in sAntwort else None))
			if 'ist_nat' in sAntwort:
				setattr(aElement, 'ist_nat', sAntwort['ist_nat'])
			if 'ist_Satz_id' in sAntwort:
				setattr(aElement, 'ist_Satz_id', sAntwort['ist_Satz_id'])
			if 'ist_bfl' in sAntwort:
				setattr(aElement, 'ist_bfl', sAntwort['ist_bfl'])
			if 'ist_token_id' in sAntwort:
				setattr(aElement, 'ist_token_id', sAntwort['ist_token_id'])
			if 'ist_token_id' in sAntwort:
				setattr(aElement, 'ist_token_id', sAntwort['ist_token_id'])
			if 'ist_tokenset_id' in sAntwort:
				setattr(aElement, 'ist_tokenset_id', sAntwort['ist_tokenset_id'])
			if 'bfl_durch_S' in sAntwort:
				setattr(aElement, 'bfl_durch_S', sAntwort['bfl_durch_S'])
			if 'Kommentar' in sAntwort:
				setattr(aElement, 'Kommentar', sAntwort['Kommentar'])
			aElement.save()
			sAntwort['nId'] = aElement.pk
			# AntwortenTags speichern
			if 'tags' in sAntwort:
				pass
				for eValue in sAntwort['tags']:
					aEbene = eValue['e']
					if aEbene > 0:
						for antwortenTag in dbmodels.AntwortenTags.objects.filter(id_Antwort=sAntwort['nId'], id_TagEbene=aEbene):
							delIt = True
							for tValue in eValue['t']:
								if int(tValue['i']) == antwortenTag.pk:
									delIt = False
							if delIt:
								antwortenTag.delete()
					reihung = 0
					if aEbene > 0:
						for tValue in eValue['t']:
							tagId = int(tValue['i'])
							if tagId > 0:
								aElement = dbmodels.AntwortenTags.objects.get(id=tagId)
							else:
								aElement = dbmodels.AntwortenTags()
							setattr(aElement, 'id_Antwort_id', sAntwort['nId'])
							setattr(aElement, 'id_Tag_id', tValue['t'])
							setattr(aElement, 'id_TagEbene_id', aEbene)
							setattr(aElement, 'Reihung', reihung)
							reihung += 1
							aElement.save()
					else:
						for tValue in eValue['t']:
							tagId = int(tValue['i'])
							if tagId > 0:
								aElement = dbmodels.AntwortenTags.objects.get(id=tagId)
								aElement.delete()
	return httpOutput(json.dumps({'OK': True}, 'application/json'))


def getSatzFromTokenList(aTokens):
	"""Satz anhand der Punktion ermitteln und vorherigen und nachfolgenden Satz ausgeben. (Auswertung und annoCheck)."""
	# start = time.time()
	with connection.cursor() as cursor:
		cursor.execute('''
			WITH o_f_token AS (
				SELECT
					t.token_reihung as o_f_token_reihung,
					x.token_reihung as o_f_prev_token_reihung,
					x.token_type_id_id as o_f_prev_token_type,
					t."ID_Inf_id" as informanten_id,
					t.transcript_id_id as transcript_id
				FROM token t
				LEFT JOIN LATERAL (
					SELECT p.token_type_id_id, p.token_reihung
					FROM token p
					WHERE
						p.token_reihung < t.token_reihung AND
						p."ID_Inf_id" = t."ID_Inf_id" AND
						p.transcript_id_id = t.transcript_id_id
					ORDER BY p.token_reihung DESC LIMIT 1
				) x ON true
				WHERE t.id = %s
			), r_f_token AS (
				SELECT
					t.token_reihung as r_f_token_reihung
				FROM token t, o_f_token oft
				WHERE
					t.token_reihung <= oft.o_f_token_reihung AND
					t."ID_Inf_id" = oft.informanten_id AND
					t.transcript_id_id = oft.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung DESC LIMIT 1
			), o_l_token AS (
				SELECT
					t.token_reihung as o_l_token_reihung,
					t.token_type_id_id as o_l_token_type
				FROM token t
				WHERE id = %s
			), r_l_token AS (
				SELECT
					t.token_reihung as r_l_token_reihung
				FROM token t, o_f_token oft, o_l_token olt
				WHERE
					t.token_reihung > olt.o_l_token_reihung AND
					t."ID_Inf_id" = oft.informanten_id AND
					t.transcript_id_id = oft.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung ASC LIMIT 1
			), base_data AS (
				SELECT
					o_f_token.o_f_token_reihung,
					(CASE
						WHEN o_f_token.o_f_prev_token_type = 2 THEN
							o_f_token.o_f_prev_token_reihung
						ELSE (
							SELECT r_f_token.r_f_token_reihung FROM r_f_token
						)
					END) as r_f_token_reihung,
					o_l_token.o_l_token_reihung,
					(CASE
						WHEN o_l_token.o_l_token_type = 2 THEN
							o_l_token.o_l_token_reihung
						ELSE (
							SELECT r_l_token.r_l_token_reihung FROM r_l_token
						)
					END) as r_l_token_reihung,
					o_l_token.o_l_token_type,
					o_f_token.transcript_id,
					o_f_token.informanten_id
				FROM o_l_token, o_f_token
			), text_data AS (
				SELECT
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || td.text, '') AS text,
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || (CASE WHEN td.ortho IS NOT NULL THEN td.ortho ELSE td.text END), '') AS orthotext
				FROM (
					SELECT *
					FROM token ttd, base_data bd
					WHERE
						ttd.token_reihung > bd.r_f_token_reihung AND
						ttd.token_reihung <= bd.r_l_token_reihung AND
						ttd."ID_Inf_id" = bd.informanten_id AND
						ttd.transcript_id_id = bd.transcript_id
					ORDER BY ttd.token_reihung ASC
				) as td
			), p_f_token AS (
				SELECT
					t.token_reihung as p_f_token_reihung
				FROM token t, base_data bd
				WHERE
					t.token_reihung < bd.r_f_token_reihung AND
					t."ID_Inf_id" = bd.informanten_id AND
					t.transcript_id_id = bd.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung DESC LIMIT 1
			), prev_text_data AS (
				SELECT
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || td.text, '') AS prev_text,
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || (CASE WHEN td.ortho IS NOT NULL THEN td.ortho ELSE td.text END), '') AS prev_orthotext
				FROM (
					SELECT *
					FROM token ttd, base_data bd, p_f_token
					WHERE
						ttd.token_reihung <= bd.r_f_token_reihung AND
						ttd.token_reihung > p_f_token.p_f_token_reihung AND
						ttd."ID_Inf_id" = bd.informanten_id AND
						ttd.transcript_id_id = bd.transcript_id
					ORDER BY ttd.token_reihung ASC
				) as td
			), n_l_token AS (
				SELECT
					t.token_reihung as n_l_token_reihung
				FROM token t, base_data bd
				WHERE
					t.token_reihung > bd.r_l_token_reihung AND
					t."ID_Inf_id" = bd.informanten_id AND
					t.transcript_id_id = bd.transcript_id AND
					t.token_type_id_id = 2
				ORDER BY t.token_reihung ASC LIMIT 1
			), next_text_data AS (
				SELECT
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || td.text, '') AS next_text,
					string_agg(CASE WHEN td.token_type_id_id=2 THEN '' ELSE ' ' END || (CASE WHEN td.ortho IS NOT NULL THEN td.ortho ELSE td.text END), '') AS next_orthotext
				FROM (
					SELECT *
					FROM token ttd, base_data bd, n_l_token
					WHERE
						ttd.token_reihung > bd.r_l_token_reihung AND
						ttd.token_reihung <= n_l_token.n_l_token_reihung AND
						ttd."ID_Inf_id" = bd.informanten_id AND
						ttd.transcript_id_id = bd.transcript_id
					ORDER BY ttd.token_reihung ASC
				) as td
			)

			SELECT
				td.*,
				ptd.*,
				ntd.*,
				bd.*
			FROM base_data bd, text_data td, prev_text_data ptd, next_text_data ntd
		''', [aTokens[0], aTokens[len(aTokens) - 1]])
		[a_text, a_orthotext, prev_text, prev_orthotext, next_text, next_orthotext, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id] = cursor.fetchone()
	return [a_text, a_orthotext, prev_text, prev_orthotext, next_text, next_orthotext, o_f_token_reihung, r_f_token_reihung, o_l_token_reihung, r_l_token_reihung, o_l_token_type, transcript_id, informanten_id]
