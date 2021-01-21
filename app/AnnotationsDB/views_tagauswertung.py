from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.db import connection
import json
from DB.funktionenDB import httpOutput


def views_tagauswertung(request):
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	with connection.cursor() as cursor:
		if 'get' in request.GET and request.GET.get('get') == 'data':
			cursor.execute('''
				SELECT
					anttags."id_Tag_id" as tag_id,
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
						WHERE subanttags."id_Tag_id" = anttags."id_Tag_id"
					) as antworten
				FROM public."AntwortenTags" as anttags
				GROUP BY "id_Tag_id"
				ORDER BY "count" DESC
			''')
			allTags = [{'id': x[0], 'count': x[1], 'data': x[2]} for x in cursor.fetchall()]
			return httpOutput(json.dumps(allTags), 'application/json')
	return render_to_response('AnnotationsDB/tagauswertungstart.html', RequestContext(request))
