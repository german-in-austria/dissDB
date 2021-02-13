from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.db import connection
import json
from DB.funktionenDB import httpOutput


def views_tagauswertung(request):
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	with connection.cursor() as cursor:
		if 'get' in request.GET:
			if request.GET.get('get') == 'data':
				cursor.execute('''
					SELECT
						anttags."id_Tag_id" as tag_id,
						anttags."id_TagEbene_id" as tagebene_id,
						COUNT("id_Tag_id") as count,
						(
							SELECT json_object_agg(
								subanttags."id_Antwort_id", json_strip_nulls(json_build_object(
									'r', subanttags."Reihung",
									't', ant."ist_token_id",
									'ts', ant."ist_tokenset_id",
									's', ant."ist_Satz_id",
									'tr', COALESCE (tok."transcript_id_id", tokts."transcript_id_id", toktst."transcript_id_id")
								))
							)
							FROM public."AntwortenTags" as subanttags
							LEFT JOIN public."Antworten" as ant ON ant.id = subanttags."id_Antwort_id"
							LEFT JOIN public."token" as tok ON tok.id = ant."ist_token_id"
							LEFT JOIN public."tokenset" as tokset ON tokset.id = ant."ist_tokenset_id"
							LEFT JOIN public."token" as tokts ON tokts.id = tokset."id_von_token_id"
							LEFT JOIN public."tokentoset" as toktoset ON toktoset."id_tokenset_id" = tokset.id
							LEFT JOIN public."token" as toktst ON toktst.id = toktoset."id_token_id"
							WHERE subanttags."id_Tag_id" = anttags."id_Tag_id" AND subanttags."id_TagEbene_id" = anttags."id_TagEbene_id"
						) as antworten
					FROM public."AntwortenTags" as anttags
					GROUP BY "id_Tag_id", "id_TagEbene_id"
					ORDER BY "count" DESC
				''')
				allTags = [{'id': x[0], 'eId': x[1], 'count': x[2], 'data': x[3]} for x in cursor.fetchall()]
				return httpOutput(json.dumps({'tagList': allTags}), 'application/json')
			if request.GET.get('get') == 'tagKontext':
				rql = request.GET.getlist('l[]')
				# print(rql, ','.join(rql), [tuple(rql)])
				cursor.execute('''
					SELECT at.*
					FROM (
						SELECT
							"id_Antwort_id",
							"id_TagEbene_id",
							(
								SELECT array_agg(
									"id_Tag_id"
									ORDER BY "Reihung"
								) as d
								FROM public."AntwortenTags" as sat
								WHERE sat."id_Antwort_id" = at."id_Antwort_id"
							) as t
						FROM public."AntwortenTags" as at
						WHERE "id_Tag_id" IN (''' + ','.join(rql) + ''')
						GROUP BY "id_Antwort_id", "id_TagEbene_id"
					) as at''' + ('''
					WHERE array_to_string(at.t, ',', '*') LIKE '%''' + ','.join(rql) + '''%'
				''' if request.GET.get('s') == 'true' else '''
					WHERE at.t @> ARRAY[''' + ', '.join(rql) + ''']
				'''))
				antwortenListe = [{'aId': x[0], 'eId': x[1], 'data': x[2]} for x in cursor.fetchall()]
				return httpOutput(json.dumps({'antwortenListe': antwortenListe}), 'application/json')
	return render_to_response('AnnotationsDB/tagauswertungstart.html', RequestContext(request))
