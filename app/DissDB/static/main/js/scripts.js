(function($){jQuery(document).ready(function($){
	/* Variablen */
	var unsavedAntworten = 0
	var unsavedEIAufgabe = 0

	/* Inits */
	resetBeeinflussung()
	resetReihungTags()
	resetReihungAntworten()
	setAudioPlayer()
	tagEbenenOptionUpdateAll()

	/* Tastenkürzel */
	Mousetrap.bind('ctrl+space', function(e) { $('#audio-play-pause').click(); return false; })
	Mousetrap.bind('ctrl+q', function(e) { $('#audio-fast-backward').click(); return false; })
	Mousetrap.bind('ctrl+w', function(e) { $('#audio-fast-forward').click(); return false; })
	Mousetrap.bind('ctrl+2', function(e) { $('#audio-backward').click(); return false; })
	Mousetrap.bind('ctrl+3', function(e) { $('#audio-forward').click(); return false; })
	Mousetrap.bind('ctrl+1', function(e) { $('#audio-step-backward').click(); return false; })
	Mousetrap.bind('ctrl+4', function(e) { $('#audio-step-forward').click(); return false; })
	Mousetrap.bind('ctrl+e', function(e) { return false; })
	Mousetrap.bind('ctrl+s', function(e) { $('#antwortensave').click(); return false; })
	Mousetrap.bind('ctrl+d', function(e) { $('#addantwort').click(); return false; })

	/* On */
	$(document).on('click','.antwort .antwortreihunghoch:not(.disabled), .antwort .antwortreihungrunter:not(.disabled)',function(e){
		var aobj = $(this).parents('.antwort')
		if($(this).hasClass('antwortreihunghoch')) {
			aobj.insertBefore(aobj.prev('.antwort:not(.delit)'))
		} else {
			aobj.insertAfter(aobj.next('.antwort:not(.delit)'))
		}
		unsavedAntworten = 1
		$('#antwortensave').removeClass('disabled')
		resetReihungAntworten()
	})
	$(document).on('change','.antwort input,.antwort textarea,select.tagebene',function(e){
		unsavedAntworten = 1
		$('#antwortensave').removeClass('disabled')
	})
	$(document).on('change','input[name="start_Antwort"], input[name="stop_Antwort"]',function(e){
		$(this).val(secondsToDuration(durationToSeconds($(this).val())))
		setAudioMarks()
	})
	$(document).on('change','#selaufgabe select',function(e){
		$('#selaufgabe').submit()
	})
	$(document).on('change','#erhinfaufgaben',function(e){
		setAudioPlayer()
	})
	$(document).on('click','#erhinfaufgaben',function(e){
		if(unsavedEIAufgabe==1) {
			if(confirm('Ungespeicherte Daten! Wollen Sie trotzdem die Datei wechseln?')) {
				unsavedEIAufgabe=0
			} else {
				$(this).blur()
			}
		}
	})
	$(document).on('change','input[name="ist_bfl"]',function(e){
		resetBeeinflussung()
	})
	$(document).on('change','#start_ErhInfAufgaben, #stop_ErhInfAufgaben',function(e){
		$(this).val(secondsToDuration(durationToSeconds($(this).val())))
		$('#aufgabenprogress .pb-starttime').html(secondsToDuration(durationToSeconds($('#start_ErhInfAufgaben').val())))
		$('#aufgabenprogress .pb-endtime').html(secondsToDuration(durationToSeconds($('#stop_ErhInfAufgaben').val())))
		unsavedEIAufgabe=1
		$('#eiaufgsave').removeClass('disabled')
		setAudioMarks()
	})
	$(document).on('click','#eiaufgsave:not(.disabled)',function(e){
		console.log({ csrfmiddlewaretoken: csrf , save: 'ErhInfAufgaben' , pk: $('#erhinfaufgaben option:selected').data('pk') , start_Aufgabe: durationToSeconds($('#start_ErhInfAufgaben').val()) , stop_Aufgabe: durationToSeconds($('#stop_ErhInfAufgaben').val()) })
		$.post('/bearbeiten/'+$('input[name="von_Inf"]').first().val()+'/'+$('input[name="zu_Aufgabe"]').first().val()+'/',{ csrfmiddlewaretoken: csrf , save: 'ErhInfAufgaben' , pk: $('#erhinfaufgaben option:selected').data('pk') , start_Aufgabe: durationToSeconds($('#start_ErhInfAufgaben').val()) , stop_Aufgabe: durationToSeconds($('#stop_ErhInfAufgaben').val()) }, function(d) {
			unsavedEIAufgabe = 0
			$('#audioplayer').html(d)
			setAudioPlayer()
		}).fail(function(d) {
			alert( "error" )
			console.log(d)
		})
	})
	$(document).on('click','#antwortensave:not(.disabled)',function(e){
		var saveit = 1
		if(!checkEbenen()) { saveit=0; };
		if(saveit==1) {
			var sAntworten = []
			$('.antwort').each(function() {
				var sAntwort = {}
				if($(this).hasClass('delit')) {
					sAntwort['delit'] = 1
				}
				$(this).find('input,textarea').each(function() {
					if($(this).attr('type')=='checkbox') {
						sAntwort[$(this).attr('name')]=$(this).is(':checked')
					} else {
						if($(this).attr('name') == 'start_Antwort' || $(this).attr('name') == 'stop_Antwort') {
							sAntwort[$(this).attr('name')]=durationToSeconds($(this).val())
						} else {
							sAntwort[$(this).attr('name')]=$(this).val()
						}
					}
				})
				sAntwort['tags'] = getTagsObject($(this))
				sAntworten.push(sAntwort)
			})
			$.post('/bearbeiten/'+$('input[name="von_Inf"]').first().val()+'/'+$('input[name="zu_Aufgabe"]').first().val()+'/',{ csrfmiddlewaretoken: csrf , save: 'Aufgaben' , aufgaben: JSON.stringify(sAntworten) }, function(d) {
				unsavedAntworten=0
				$('#aufgabencontent').html(d)
				addAntwort()
				resetBeeinflussung()
				InformantenAntwortenUpdate()
				tagEbenenOptionUpdateAll()
			}).fail(function(d) {
				alert( "error" )
				console.log(d)
			})
		}
	})
	$(document).on('click','.lmfabc',function(e){
		e.preventDefault()
		if((unsavedAntworten==0 && unsavedEIAufgabe==0) || confirm('Es gibt noch ungespeicherte veränderungen! Wirklich verwerfen?')) {
			unsavedAntworten=0
			unsavedEIAufgabe=0
			$('.lmfabc').removeClass('open')
			$(this).addClass('open')
			$.post($(this).attr('href'),{ csrfmiddlewaretoken: csrf }, function(d) {
				$('.mcon').html(d)
				addAntwort()
				resetBeeinflussung()
				tagEbenenOptionUpdateAll()
				setAudioPlayer()
			}).fail(function(d) {
				alert( "error" )
				console.log(d)
			})
		}
	})
	window.onbeforeunload = function () {
		if(unsavedAntworten!=0 || unsavedEIAufgabe!=0) {
			return 'Es gibt noch ungespeicherte Veränderungen! Wirklich verwerfen?'
		}
	}
	$(document).on('click','.delantwort',function(e){
		if(confirm('Soll diese "Antwort" tatsächlich gelöscht werden?')) {
			var aselobj = $(this).parents('.antwort')
			if(aselobj.find('input[name="id_Antwort"]').val() == 0) {
				aselobj.remove()
			} else {
				aselobj.addClass('delit')
			}
		}
		unsavedAntworten = 1
		$('#antwortensave').removeClass('disabled')
		resetReihungAntworten()
	})
	$(document).on('click','#addantwort',function(e){
		addAntwort()
	})
	/* Tags */
	$(document).mouseup(closeTagSelect)
	$(document).on('click','.antwort .ptagsleft, .antwort .ptagsright',moveTagLeftRightClick)
	$(document).on('click','.ant-ntag',openNewTagSelectClick)
	$(document).on('click','.ant-ctag',openTagPresetSelectClick)
	$(document).on('click','.ant-tag',openChangeTagSelectClick)
	$(document).on('click','.edittag .ptagsbtn:not(.ptagsleft,.ptagsright)',tagAendernLoeschenClick)
	$(document).on('click','.newtag .ptagsbtn',tagHinzufuegenClick)
	$(document).on('click','.pretags .pretagsbtn',tagPresetHinzufuegenClick)
	$(document).on('click','.add-tag-line',addTagLineClick)
	$(document).on('change','select.tagebene',tagEbeneChange)
	/* Audio */
	$(document).on('click','#aufgabenprogress, #inferhebungprogress',progressClick)
	$(document).on('click','#audio-play-pause',playPauseClick)
	$(document).on('click','#audio-fast-backward',fastBackwardClick)
	$(document).on('click','#audio-fast-forward',fastForwardClick)
	$(document).on('click','#audio-backward',backwardClick)
	$(document).on('click','#audio-forward',forwardClick)
	$(document).on('click','#audio-step-backward',stepBackwardClick)
	$(document).on('click','#audio-step-forward',stepForwardClick)
	$(document).on('click','#audio-step-forward',function(e){ InformantenAntwortenUpdate(); })

	/* Funktionen */
	function post(path, params, target, method) { method = method || "post"; var form = document.createElement("form"); form.setAttribute("method", method); form.setAttribute("action", path); if(target) { form.setAttribute("target", target); }; for(var key in params) { if(params.hasOwnProperty(key)) { var hiddenField = document.createElement("input"); hiddenField.setAttribute("type", "hidden"); hiddenField.setAttribute("name", key); hiddenField.setAttribute("value", params[key]); form.appendChild(hiddenField); };}; document.body.appendChild(form); form.submit(); };
	function InformantenAntwortenUpdate() {
		$.post('/bearbeiten/',{ csrfmiddlewaretoken: csrf , infantreset: 1 , aaufgabenset: $('select[name="aaufgabenset"]').val() , aaufgabe: $('select[name="aaufgabe"]').val() }, function(d) {
			$.each($.parseJSON(d),function(k,v) {
				$('.lmfabc[data-pk="'+k+'"] span').html(v)
			})
		}).fail(function(d) {
			alert( "error" )
			console.log(d)
		})
	}
	function resetBeeinflussung() {
		$('.antwort').each(function() {
			if($(this).find('input[name="ist_bfl"]').is(':checked')) {
				$(this).find('.ist_bfl_lf').removeClass('col-sm-12').addClass('col-sm-8')
				$(this).find('.ist_bfl_lf .col-sm-2').removeClass('col-sm-2').addClass('col-sm-3')
				$(this).find('.ist_bfl_lf .col-sm-10').removeClass('col-sm-10').addClass('col-sm-9')
				$(this).find('.ist_bfl_rf').show()
			} else {
				$(this).find('.ist_bfl_lf').removeClass('col-sm-8').addClass('col-sm-12')
				$(this).find('.ist_bfl_lf .col-sm-3').removeClass('col-sm-3').addClass('col-sm-2')
				$(this).find('.ist_bfl_lf .col-sm-9').removeClass('col-sm-9').addClass('col-sm-10')
				$(this).find('.ist_bfl_rf').hide()
			}
		})
	}
	function resetReihungAntworten() {
		var areihung = 1
		$('.antwort .antwortreihunghoch, .antwort .antwortreihungrunter').removeClass('disabled')
		$('.antwort:not(.delit)').each(function(){
			if(areihung==1) { $(this).find('.antwortreihunghoch').addClass('disabled'); }
			$(this).find('input[name="reihung"]').val(areihung)
			$(this).find('.areihung').html(areihung)
			areihung+=1
		})
		$('.antwort:not(.delit)').find('.antwortreihungrunter').last().addClass('disabled');
		$('input,textarea').addClass('mousetrap')
	}
	function addAntwort() {
		$('.antwortenvorlage').first().before('<div class="antwort">'+$('.antwortenvorlage').html()+'</div>')
		$('.antwort input[name="ist_Satz_Standardorth"]').focus()
		resetReihungTags()
		resetReihungAntworten()
		resetBeeinflussung()
	}

});})(jQuery);
