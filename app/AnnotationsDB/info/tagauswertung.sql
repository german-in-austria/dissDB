SELECT
  (
    SELECT JSON_AGG(ROW_TO_JSON(antw.*))
    FROM (
      SELECT
        antwt.id,
        (
          SELECT JSON_AGG(json_build_object('r', atag."Reihung", 'tId', atag."id_Tag_id", 'eId', atag."id_TagEbene_id"))
          FROM PUBLIC."AntwortenTags" AS atag
          WHERE atag."id_Antwort_id" = antwt.id
        ) AS tags
      FROM PUBLIC."Antworten" AS antwt
      WHERE
        antwt.ist_token_id = ANY(tokendata.tokens) OR
        antwt.ist_tokenset_id = ANY(
          SELECT tsi."id_tokenset_id"
          FROM (
              SELECT tts2."id_tokenset_id" AS "id_tokenset_id"
              FROM PUBLIC."tokentoset" AS tts2
              WHERE tts2."id_token_id" = ANY(tokendata.tokens)
            UNION ALL
              SELECT ttsc2."id_tokenset_id" AS "id_tokenset_id"
              FROM PUBLIC."tokentoset_cache" AS ttsc2
              WHERE ttsc2."id_token_id" = ANY(tokendata.tokens)
          ) AS tsi
        )
    ) AS antw
  ) AS antworten,
  tokendata.*
FROM (
  SELECT
  	CASE WHEN ant."ist_token_id" > 0
  		THEN
        ARRAY[ant."ist_token_id"]
  		ELSE (
        SELECT ARRAY_AGG(tokids.tid)
        FROM (
            SELECT tts."id_token_id" AS tid
            FROM PUBLIC."tokentoset" AS tts
            WHERE tts."id_tokenset_id" = ant."ist_tokenset_id"
          UNION ALL
            SELECT ttsc."id_token_id" as tid
            FROM PUBLIC."tokentoset_cache" AS ttsc
            WHERE ttsc."id_tokenset_id" = ant."ist_tokenset_id"
          ) AS tokids
        )
  	END AS tokens,
  	row_to_json(at.*) AS data
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
  	WHERE "id_Tag_id" IN (1167, 1168)
  	GROUP BY "id_Antwort_id", "id_TagEbene_id"
  ) as at
  LEFT JOIN public."Antworten" as ant ON id = at."id_Antwort_id"
  WHERE (ant."ist_token_id" > 0 OR ant."ist_tokenset_id" > 0) AND array_to_string(at.t, ',', '*') LIKE '%1167,1168%'
) AS tokendata