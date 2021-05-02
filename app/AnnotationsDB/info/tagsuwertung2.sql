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
				'tr', COALESCE (tok."transcript_id_id", tokts."transcript_id_id", toktst."transcript_id_id"),
				'tc', (
          json_build_object(
            't', CASE WHEN tok.id is NOT NULL THEN 1 ELSE 0 END,
            'wt', CASE WHEN tok.token_type_id_id in (1,4,8) THEN 1 ELSE 0 END
          )
        ),
				'tsc', (
					SELECT json_build_object(
            't', COUNT(xtokts.*),
            'wt', COUNT(xtokts.*) FILTER(WHERE xtokts.fragment_of_id is NULL AND xtokts.token_type_id_id in (1,4,8))
          )
					FROM public."tokentoset_cache" as xtoktosetc
          LEFT JOIN public."token" as xtokts ON xtokts.id = xtoktosetc."id_token_id"
					WHERE xtoktosetc."id_tokenset_id" = tokset.id
				),
				'tstc', (
					SELECT json_build_object(
            't', COUNT(xtoktst.*),
            'wt', COUNT(xtoktst.*) FILTER(WHERE xtoktst.fragment_of_id is NULL AND xtoktst.token_type_id_id in (1,4,8))
          )
					FROM public."tokentoset" as xtoktoset
          LEFT JOIN public."token" as xtoktst ON xtoktst.id = xtoktoset."id_token_id"
					WHERE xtoktoset."id_tokenset_id" = tokset.id
				)
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
