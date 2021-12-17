from django.shortcuts import render_to_response, redirect
from django.http import HttpResponse
from django.template import RequestContext
from django.db.models import Count
from django.conf import settings
from django.db import connection
import Datenbank.models as dbmodels
import AnnotationsDB.models as adbmodels
import datetime
import time
import subprocess
import os
import operator


def views_transkript(request, aTranskript):
	if not request.user.is_authenticated():
		return redirect('dissdb_login')
	if 'get' in request.GET and request.GET.get('get') == 'xlsfiles':
		subprocess.Popen([settings.DISS_DB_PYTHON, os.path.join(settings.BASE_DIR, 'manage.py'), 'transkripte_xls'])
	aTranskript = int(aTranskript)
	aTranskriptName = ''
	transkripte = []
	aEvents = []
	getXls = False
	if 'get' in request.GET and request.GET.get('get') == 'xls':
		getXls = True
	for aT in adbmodels.transcript.objects.all():
		transkripte.append({'pk': aT.pk, 'title': str(aT)})
		if aT.pk == aTranskript:
			aTranskriptName = (aT.name + '-' if aT.name else '') + str(aT.pk)
	if aTranskript > 0:
		if getXls:
			return views_transkript_data(aTranskript, aTranskriptName, True)
		else:
			aEvents = views_transkript_data(aTranskript, aTranskriptName, False)
	return render_to_response('AnnotationsDB/transkriptstart.html', RequestContext(request, {'transkripte': transkripte, 'aTranskriptName': aTranskriptName, 'aTranskript': aTranskript, 'aEventsX': aEvents[0:100]}))


def views_transkript_data(aTranskript, aTranskriptName, getXls, justWb = False):
	aTokens = []
	aEvents = []
	dg = 0
	eDg = 0
	max = 999999 if getXls else 100
	allEvents = list(adbmodels.event.objects.prefetch_related('rn_token_event_id').filter(rn_token_event_id__transcript_id=aTranskript).distinct()[0:max])
	for aE in allEvents:
		aEvent = {
			'aNr': eDg + 1,
			'eId': aE.pk,
			'eStart': aE.start_time,
			'eEnd': aE.end_time,
			'eLayer': str(aE.layer if aE.layer else 0),
			'tId': '',
			't': '',
			'tt': '',
			'ttT': '',
			'tr': '',
			'to': '',
			'i': '',
			'iT': '',
			'o': '',
			'ot': '',
			'otrein': '',
			's': '',
			'sr': '',
			'fo': '',
			'le': '',
			'ttpos': '',
			'ttlemma': '',
			'ttcheckword': '',
			'sppos': '',
			'sptag': '',
			'splemma': '',
			'spdep': '',
			'sphead': '',
			'spenttype': '',
			'sk': 0,
			'wordCount': 0,
			'incomprehensible': 0,
			'singulaer': 0
		}
		infIds = []
		infTitles = []
		wordCount = 0
		incomprehensible = False
		dg = 0
		for aT in sorted(list(aE.rn_token_event_id.all()), key=operator.attrgetter("token_reihung")):
			aToken = {
				'aNr': dg + 1,
				'eId': aE.pk,
				'eStart': aE.start_time,
				'eEnd': aE.end_time,
				'eLayer': str(aE.layer if aE.layer else 0),
				'tId': aT.pk,
				'tr': aT.token_reihung,
				'tt': aT.token_type_id_id,
				'ttT': str(aT.token_type_id),
				'i': aT.ID_Inf_id,
				'iT': str(aT.ID_Inf),
				't': aT.text if aT.text else '',
				'to': aT.text_in_ortho if aT.text_in_ortho else '',
				'o': aT.ortho if aT.ortho else '',
				'ot': aT.ortho if aT.ortho else aT.text if aT.text else '',
				'ttpos': aT.ttpos if aT.ttpos else '',
				'ttlemma': aT.ttlemma if aT.ttlemma else '',
				'ttcheckword': aT.ttcheckword if aT.ttcheckword else '',
				'sppos': aT.sppos if aT.sppos else '',
				'sptag': aT.sptag if aT.sptag else '',
				'splemma': aT.splemma if aT.splemma else '',
				'spdep': aT.spdep if aT.spdep else '',
				'sphead': aT.sphead if aT.sphead else '',
				'spenttype': aT.spenttype if aT.spenttype else '',
				's': aT.sentence_id_id,
				'sr': aT.sequence_in_sentence if aT.sequence_in_sentence else '0',
				'fo': aT.fragment_of_id if aT.fragment_of_id else '',
				'le': 1 if aT.likely_error else '',
			}
			if aToken['tt'] == 1:
				wordCount += 1
			if aToken['tt'] == 7:
				incomprehensible = True
			aEvent['tId'] += ((', ' if aEvent['tId'] else '') + str(aToken['tId'])) if aToken['tId'] else ''
			aEvent['tr'] += ((', ' if aEvent['tr'] else '') + str(aToken['tr'])) if aToken['tr'] else ''
			aEvent['tt'] += ((', ' if aEvent['tt'] else '') + str(aToken['tt'])) if aToken['tt'] else ''
			aEvent['ttT'] += ((', ' if aEvent['ttT'] else '') + str(aToken['ttT'])) if aToken['ttT'] else ''
			if str(aToken['i']) not in infIds:
				infIds.append(str(aToken['i']))
			if aToken['iT'] not in infTitles:
				infTitles.append(aToken['iT'])
			aEvent['t'] += ((' ' if aEvent['t'] and aToken['tt'] != 2 else '') + str(aToken['t'])) if aToken['t'] else ''
			aEvent['to'] += ((' ' if aEvent['to'] and aToken['tt'] != 2 else '') + str(aToken['to'])) if aToken['to'] else ''
			aEvent['o'] += ((' ' if aEvent['o'] and aToken['tt'] != 2 else '') + str(aToken['o'])) if aToken['o'] else '*'
			aEvent['ot'] += ((' ' if aEvent['ot'] and aToken['tt'] != 2 else '') + str(aToken['ot'])) if aToken['ot'] else ''
			aEvent['otrein'] += (((' ' if aEvent['ot'] and aToken['tt'] != 2 else '') + str(aToken['ot'])) if aToken['ot'] else '') if not aEvent['fo'] and aToken['tt'] in [1, 2, 4, 8] else ''
			aEvent['ttpos'] += ((' ' if aEvent['ttpos'] else '') + str(aToken['ttpos'])) if aToken['ttpos'] else '*'
			aEvent['ttlemma'] += ((' ' if aEvent['ttlemma'] and aToken['tt'] != 2 else '') + str(aToken['ttlemma'])) if aToken['ttlemma'] else '*'
			aEvent['ttcheckword'] += ((' ' if aEvent['ttcheckword'] and aToken['tt'] != 2 else '') + str(aToken['ttcheckword'])) if aToken['ttcheckword'] else '*'
			aEvent['sppos'] += ((' ' if aEvent['sppos'] else '') + str(aToken['sppos'])) if aToken['sppos'] else '*'
			aEvent['sptag'] += ((' ' if aEvent['sptag'] else '') + str(aToken['sptag'])) if aToken['sptag'] else '*'
			aEvent['splemma'] += ((' ' if aEvent['splemma'] and aToken['tt'] != 2 else '') + str(aToken['splemma'])) if aToken['splemma'] else '*'
			aEvent['spdep'] += ((' ' if aEvent['spdep'] else '') + str(aToken['spdep'])) if aToken['spdep'] else '*'
			aEvent['sphead'] += ((' ' if aEvent['sphead'] else '') + str(aToken['sphead'])) if aToken['sphead'] else '*'
			aEvent['spenttype'] += ((' ' if aEvent['spenttype'] else '') + str(aToken['spenttype'])) if aToken['spenttype'] else '*'
			aEvent['s'] += ((', ' if aEvent['s'] else '') + str(aToken['s'])) if aToken['s'] else ''
			aEvent['sr'] += ((', ' if aEvent['sr'] else '') + str(aToken['sr'])) if aToken['sr'] else ''
			aEvent['fo'] += (', ' if aEvent['fo'] else '') + (str(aToken['fo']) if aToken['fo'] else '0')
			aEvent['le'] += (', ' if aEvent['le'] else '') + (str(aToken['le']) if aToken['le'] else '0')
			aTokens.append(aToken)
			dg += 1
		singulaer = True
		if eDg > 0:
			if allEvents[eDg - 1].start_time == aE.start_time:
				singulaer = False
		if singulaer and eDg + 1 < len(allEvents):
			if allEvents[eDg + 1].start_time == aE.start_time:
				singulaer = False
			else:
				if eDg + 2 < len(allEvents):
					if allEvents[eDg + 2].start_time == allEvents[eDg + 1].start_time:
						singulaer = False
		# aEvent['sk'] = str(wordCount) + ' - ' + str(incomprehensible) + ' - ' + str(singulaer)
		aEvent['wordCount'] = wordCount
		aEvent['incomprehensible'] = 1 if incomprehensible else 0
		aEvent['singulaer'] = 1 if singulaer else 0
		if wordCount > 4 and not incomprehensible and singulaer:
			aEvent['sk'] = 1
		aEvent['i'] += ', '.join(infIds)
		aEvent['iT'] += ', '.join(infTitles)
		aEvents.append(aEvent)
		eDg += 1
	if getXls:
		import xlwt
		response = HttpResponse(content_type='text/ms-excel')
		response['Content-Disposition'] = 'attachment; filename="' + str(aTranskriptName) + '-' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S') + '.xls"'
		wb = xlwt.Workbook(encoding='utf-8')
		ws = wb.add_sheet('Transkript ' + str(aTranskriptName))
		row_num = 0
		columns = []
		columns.append(('Nr', 2000))
		columns.append(('Informant', 2000))
		columns.append(('iId', 2000))
		columns.append(('eId', 2000))
		columns.append(('eStart', 2000))
		columns.append(('eEnd', 2000))
		columns.append(('tId', 2000))
		columns.append(('tr', 2000))
		columns.append(('Token Type', 2000))
		columns.append(('ttId', 2000))
		columns.append(('t', 2000))
		# columns.append(('to', 2000))
		columns.append(('o', 2000))
		columns.append(('ot', 2000))
		columns.append(('otrein', 2000))
		columns.append(('ttpos', 2000))
		columns.append(('ttlemma', 2000))
		columns.append(('ttcheckword', 2000))
		columns.append(('sppos', 2000))
		columns.append(('sptag', 2000))
		columns.append(('splemma', 2000))
		columns.append(('spdep', 2000))
		columns.append(('sphead', 2000))
		columns.append(('spenttype', 2000))
		columns.append(('Sentence Id', 2000))
		columns.append(('sr', 2000))
		columns.append(('foId', 2000))
		columns.append(('le', 2000))
		columns.append(('Snippetkandidat', 2000))
		columns.append(('wordCount', 2000))
		columns.append(('incomprehensible', 2000))
		columns.append(('singulaer', 2000))
		font_style = xlwt.XFStyle()
		font_style.font.bold = True
		for col_num in range(len(columns)):
			ws.write(row_num, col_num, columns[col_num][0], font_style)
		font_style = xlwt.XFStyle()
		for obj in aEvents:
			row_num += 1
			ws.write(row_num, 0, xls_max_chars(obj['aNr']), font_style)
			ws.write(row_num, 1, xls_max_chars(obj['iT']), font_style)
			ws.write(row_num, 2, xls_max_chars(obj['i']), font_style)
			ws.write(row_num, 3, xls_max_chars(obj['eId']), font_style)
			ws.write(row_num, 4, xls_max_chars(str(obj['eStart'])), font_style)
			ws.write(row_num, 5, xls_max_chars(str(obj['eEnd'])), font_style)
			ws.write(row_num, 6, xls_max_chars(obj['tId']), font_style)
			ws.write(row_num, 7, xls_max_chars(obj['tr']), font_style)
			ws.write(row_num, 8, xls_max_chars(obj['ttT']), font_style)
			ws.write(row_num, 9, xls_max_chars(obj['tt']), font_style)
			ws.write(row_num, 10, xls_max_chars(obj['t']), font_style)
			# ws.write(row_num, 11, xls_max_chars(obj['to']), font_style)
			ws.write(row_num, 11, xls_max_chars(obj['o']), font_style)
			ws.write(row_num, 12, xls_max_chars(obj['ot']), font_style)
			ws.write(row_num, 13, xls_max_chars(obj['otrein']), font_style)
			ws.write(row_num, 14, xls_max_chars(obj['ttpos']), font_style)
			ws.write(row_num, 15, xls_max_chars(obj['ttlemma']), font_style)
			ws.write(row_num, 16, xls_max_chars(obj['ttcheckword']), font_style)
			ws.write(row_num, 17, xls_max_chars(obj['sppos']), font_style)
			ws.write(row_num, 18, xls_max_chars(obj['sptag']), font_style)
			ws.write(row_num, 19, xls_max_chars(obj['splemma']), font_style)
			ws.write(row_num, 20, xls_max_chars(obj['spdep']), font_style)
			ws.write(row_num, 21, xls_max_chars(obj['sphead']), font_style)
			ws.write(row_num, 22, xls_max_chars(obj['spenttype']), font_style)
			ws.write(row_num, 23, xls_max_chars(obj['s']), font_style)
			ws.write(row_num, 24, xls_max_chars(obj['sr']), font_style)
			ws.write(row_num, 25, xls_max_chars(obj['fo']), font_style)
			ws.write(row_num, 26, xls_max_chars(obj['le']), font_style)
			ws.write(row_num, 27, xls_max_chars(obj['sk']), font_style)
			ws.write(row_num, 28, xls_max_chars(obj['wordCount']), font_style)
			ws.write(row_num, 29, xls_max_chars(obj['incomprehensible']), font_style)
			ws.write(row_num, 30, xls_max_chars(obj['singulaer']), font_style)
		if justWb:
			return wb
		else:
			wb.save(response)
			return response
	else:
		return aEvents

def xls_max_chars(aVal):
	"""Bei String Länge auf maximum setzen."""
	if type(aVal) == str and len(aVal) > 32600:
		return 'err: too long! - ' + aVal[:32600] + '...'
	else:
		return aVal
