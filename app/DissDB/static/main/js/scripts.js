(function($){jQuery(document).ready(function($){
	var basedir = '/private-media/'
	var audio = new Audio('');
	var audioisnewset = 1
	var unsavedAntworten = 0
	var unsavedEIAufgabe = 0
	var audiomarks = []

	resetBeeinflussung()
	resetReihungTags()
	resetReihungAntworten()
	setAudioPlayer()


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
	$(document).on('click','.antwort .ptagsleft, .antwort .ptagsright',function(e){
		var aselobj = $(this).parents('.seltags')
		var targettag
		$(this).parents('.reihung-tags').find('.ant-tag').each(function(){
			if($(this).data('reihung') == aselobj.data('reihung')) {
				targettag = $(this)
			}
		})
		$(this).parents('.seltags').remove()
		if($(this).hasClass('ptagsleft')) {
			targettag.insertBefore(targettag.prev('.ant-tag:not(.delit)'))
		} else {
			targettag.insertAfter(targettag.next('.ant-tag:not(.delit)'))
		}
		unsavedAntworten = 1
		$('#antwortensave').removeClass('disabled')
		resetReihungTags()
	})
	$(document).on('change','.antwort input,.antwort textarea',function(e){
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
			var tags = []
			$(this).find('.ant-tag').each(function() {
				tags.push({'reihung':$(this).data('reihung') , 'popup':$(this).data('popup') , 'id_tag':$(this).data('id_tag') , 'pk':$(this).data('pk') })
			})
			sAntwort['tags'] = tags
			sAntworten.push(sAntwort)
		})
		$.post('/bearbeiten/'+$('input[name="von_Inf"]').first().val()+'/'+$('input[name="zu_Aufgabe"]').first().val()+'/',{ csrfmiddlewaretoken: csrf , save: 'Aufgaben' , aufgaben: JSON.stringify(sAntworten) }, function(d) {
			unsavedAntworten=0
			$('#aufgabencontent').html(d)
			addAntwort()
			resetBeeinflussung()
			InformantenAntwortenUpdate()
		}).fail(function(d) {
			alert( "error" )
			console.log(d)
		})
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
	$(document).mouseup(function (e) {
		var container = $(".seltags")
		if (!container.is(e.target) && container.has(e.target).length === 0) { container.remove(); }
	})
	$(document).on('click','.ant-ntag',function(e){
		var apos = $(this).position()
		$(this).after('<div class="tags seltags newtag" style="left:'+apos.left+'px;">'+$('#'+$(this).data('popup')).html()+'</div>')
		$(this).blur()
	})
	$(document).on('click','.ant-ctag',function(e){
		var apos = $(this).position()
		$(this).after('<div class="tags seltags pretags" style="left:'+apos.left+'px;">'+$('#pretags').html()+'</div>')
		$(this).blur()
	})
	$(document).on('click','.ant-tag',function(e){
		var apos = $(this).position()
		$(this).after('<div class="tags seltags edittag" style="left:'+apos.left+'px;" data-reihung="'+$(this).data('reihung')+'">'+$('#'+$(this).data('popup')).html()+'</div>')
		$('.seltags').find('.ptagsbtn[data-pk="' + $(this).data('id_tag') + '"]').addClass('active')
		$(this).blur()
	})
	$(document).on('click','.edittag .ptagsbtn:not(.ptagsleft,.ptagsright)',function(e){
		var aselobj = $(this).parents('.seltags')
		var othis=this
		if($(othis).data('pk')!=0 || ($(othis).data('pk')==0&&confirm('Soll dieser "AntwortenTag" tatsächlich gelöscht werden?'))) {
			$(this).parents('.reihung-tags').find('.ant-tag').each(function(){
				if($(this).data('reihung') == aselobj.data('reihung')) {
					$(this).data('id_tag',$(othis).data('pk')).html($(othis).html())
					if($(othis).data('pk')==0) {
						if($(this).data('pk')==0) {
							$(this).remove()
						} else {
							$(this).addClass('delit')
						}
					}
				}
			})
		}
		aselobj.remove()
		resetReihungTags()
		unsavedAntworten = 1
		$('#antwortensave').removeClass('disabled')
	})
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
	$(document).on('click','.newtag .ptagsbtn',function(e){
		var aselobj = $(this).parents('.seltags')
		$(this).parents('.reihung-tags').find('.ant-ntag').before('<button class="ant-tag" data-popup="'+$(this).parents('.reihung-tags').find('.ant-ntag').data('popup')+'" data-id_tag="'+$(this).data('pk')+'" data-pk="0">'+$(this).html()+'</button>')
		aselobj.remove()
		resetReihungTags()
		unsavedAntworten = 1
		$('#antwortensave').removeClass('disabled')
	})
	$(document).on('click','.pretags .pretagsbtn',function(e){
		var aselobj = $(this).parents('.seltags')
		var apopup = $(this).parents('.reihung-tags').find('.ant-ntag').data('popup')
		var athis = $(this)
		$.each($(this).data('pks').split(';'),function(i,e){
			var adata = e.split(',',2)
			athis.parents('.reihung-tags').find('.ant-ntag').before('<button class="ant-tag" data-popup="'+apopup+'" data-id_tag="'+adata[0]+'" data-pk="0">'+adata[1]+'</button>')
		})
		aselobj.remove()
		resetReihungTags()
		unsavedAntworten = 1
		$('#antwortensave').removeClass('disabled')
	})
	$(document).on('click','#addantwort',function(e){
		addAntwort()
	})

	$(document).on('click','#aufgabenprogress, #inferhebungprogress',function(e){
		var parentOffset = $(this).parent().offset();
		azpos = (e.pageX - parentOffset.left - 15) / $(this).width()
		aspos = durationToSeconds($(this).find('.pb-starttime').html())
		aepos = durationToSeconds($(this).find('.pb-endtime').html())
		audio.currentTime = aspos + ((aepos-aspos) * azpos)
	})
	$(document).on('click','#audio-play-pause',function(e){
		var aappgi = $(this).find('.glyphicon')
		if(aappgi.hasClass('glyphicon-play')) {
			audio.play();
		} else {
			audio.pause();
		}
	})
	$(document).on('click','#audio-fast-backward',function(e){
		audio.currentTime = durationToSeconds($('#start_ErhInfAufgaben').val())
	})
	$(document).on('click','#audio-fast-forward',function(e){
		audio.currentTime = durationToSeconds($('#stop_ErhInfAufgaben').val())
	})
	$(document).on('click','#audio-backward',function(e){
		audio.currentTime = audio.currentTime-10
	})
	$(document).on('click','#audio-forward',function(e){
		audio.currentTime = audio.currentTime+10
	})
	$(document).on('click','#audio-step-backward',function(e){
		if(audiomarks.length>0) {
			gtt=0
			gtts=999999999999999
			for (i = 0; i < audiomarks.length; ++i) {
				if(audiomarks[i]<(audio.currentTime-1)&&audiomarks[i]>gtt) { gtt = audiomarks[i]; }
				if(audiomarks[i]<gtts) { gtts = audiomarks[i]; }
			}
			if(gtt==0) { gtt=gtts; }
			audio.currentTime = gtt
		}
	})
	$(document).on('click','#audio-step-forward',function(e){
		if(audiomarks.length>0) {
			gtt=999999999999999
			gtts=0
			for (i = 0; i < audiomarks.length; ++i) {
				if(audiomarks[i]>(audio.currentTime)&&audiomarks[i]<gtt) { gtt = audiomarks[i]; }
				if(audiomarks[i]>gtts) { gtts = audiomarks[i]; }
			}
			if(gtt==999999999999999) { gtt=gtts; }
			audio.currentTime = gtt
		}
	})
	$(document).on('click','#audio-step-forward',function(e){
		InformantenAntwortenUpdate()
	})

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

	/* Funktionen */
	function post(path, params, target, method) { method = method || "post"; var form = document.createElement("form"); form.setAttribute("method", method); form.setAttribute("action", path); if(target) { form.setAttribute("target", target); }; for(var key in params) { if(params.hasOwnProperty(key)) { var hiddenField = document.createElement("input"); hiddenField.setAttribute("type", "hidden"); hiddenField.setAttribute("name", key); hiddenField.setAttribute("value", params[key]); form.appendChild(hiddenField); };}; document.body.appendChild(form); form.submit(); };
	function durationToSeconds(hms) {
		var a = hms.split(':'); var s = 0.0
		if(a.length>2) { s+=parseFloat(a[a.length-3]) * 60 * 60; }
		if(a.length>1) { s+=parseFloat(a[a.length-2]) * 60; }
		if(a.length>0) { s+=parseFloat(a[a.length-1]); }
		return s
	}
	function secondsToDuration(sec) {
		var h = parseInt(sec / 3600)
		sec %= 3600;
		var m = parseInt(sec / 60)
		var s = sec % 60
		return ("0" + h).slice(-2) + ':' + ("0" + m).slice(-2) + ':' + ("0" + s.toFixed(6)).slice(-9)
	}
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
	function resetReihungTags() {
		$('.reihung-tags').each(function(){
			var areihung = 1
			$(this).find('.ant-tag:not(.delit)').each(function(){
				$(this).data('reihung',areihung)
				areihung+=1
			})
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
	function setAudioMarks() {
		audiomarks = []
		$('#aufgabenprogress .markarea,#inferhebungprogress .markarea').remove()
		if($('.antwort').length>0) {
			aeltuasErh = durationToSeconds($('#start_ErhInfAufgaben').val())
			aeltuaeErh = durationToSeconds($('#stop_ErhInfAufgaben').val())
			aeltualErh = aeltuaeErh-aeltuasErh
			$('#inferhebungprogress').append('<div class="markarea" style="left:'+(100/audio.duration*(aeltuasErh))+'%;width:'+(100/audio.duration*(aeltuaeErh-aeltuasErh))+'%"></div>')
			$('.antwort').each(function() {
				asSec = durationToSeconds($(this).find('input[name="start_Antwort"]').val())
				aeSec = durationToSeconds($(this).find('input[name="stop_Antwort"]').val())
				if(asSec>0 && aeSec>0 && aeSec>asSec && aeSec>=aeltuasErh && aeSec<=aeltuaeErh) {
					audiomarks.push(asSec)
					audiomarks.push(aeSec)
					console.log(asSec+' - '+aeSec)
					$('#aufgabenprogress').append('<div class="markarea" style="left:'+(100/aeltualErh*(asSec-aeltuasErh))+'%;width:'+(100/aeltualErh*(aeSec-asSec))+'%"></div>')
				}
			})
		}
		audiomarks.sort()
	}
	function setAudioPlayer() {
		if($('#audioplayer').children().length>0) {
			aopt = $('#erhinfaufgaben option:selected')
			$('#start_ErhInfAufgaben').val(secondsToDuration(durationToSeconds(aopt.data('start_aufgabe'))))
			$('#stop_ErhInfAufgaben').val(secondsToDuration(durationToSeconds(aopt.data('stop_aufgabe'))))
			$('#aufgabenprogress .pb-starttime').html(secondsToDuration(durationToSeconds(aopt.data('start_aufgabe'))))
			$('#aufgabenprogress .pb-endtime').html(secondsToDuration(durationToSeconds(aopt.data('stop_aufgabe'))))
			var audiofile = basedir+aopt.data('audiofile')+'.mp3'
			if(audiofile.length>2) {
				audio.src=audiofile
				audio.load()
				audioisnewset = 1
			}
		}
		unsavedEIAufgabe=0
		$('#eiaufgsave').addClass('disabled')
		setAudioMarks()
	}
	setInterval(function () {
		$('.pb-akttime').html(secondsToDuration(audio.currentTime))
		if(audioisnewset==0) {
			$('#inferhebungprogress .progress-bar').css('width',(100/audio.duration*audio.currentTime)+'%')
			aeltuasErh = durationToSeconds($('#start_ErhInfAufgaben').val())
			aeltuaeErh = durationToSeconds($('#stop_ErhInfAufgaben').val())
			if(audio.currentTime>=aeltuasErh && audio.currentTime<=aeltuaeErh) {
				$('#aufgabenprogress .progress-bar').css('width',(100/(aeltuaeErh-aeltuasErh)*(audio.currentTime-aeltuasErh))+'%')
			} else if(audio.currentTime<aeltuasErh) {
				$('#aufgabenprogress .progress-bar').css('width','0%')
			} else {
				$('#aufgabenprogress .progress-bar').css('width','100%')
			}
		}
	}, 50);

	audio.addEventListener("durationchange", function() {
		$('#inferhebungprogress .pb-endtime').html(secondsToDuration(audio.duration))
	}, false);
	audio.addEventListener("play", function() {
		if(audioisnewset==1) {
			setTimeout(function() { audio.currentTime = durationToSeconds($('#erhinfaufgaben option:selected').data('start_aufgabe')); setAudioMarks(); }, 100)
			audioisnewset = 0
		}
		$('#aufgabenprogress .progress-bar, #inferhebungprogress .progress-bar').addClass('active')
		$('#audio-play-pause .glyphicon').addClass('glyphicon-pause').removeClass('glyphicon-play')
	}, false);
	audio.addEventListener("pause", function() {
		$('#aufgabenprogress .progress-bar, #inferhebungprogress .progress-bar').removeClass('active')
		$('#audio-play-pause .glyphicon').addClass('glyphicon-play').removeClass('glyphicon-pause')
	}, false);




});})(jQuery);
