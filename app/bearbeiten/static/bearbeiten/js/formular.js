/* On */
function antwortReihungHochRunterClick(e){
  var aobj = $(this).parents('.antwort')
  if($(this).hasClass('antwortreihunghoch')) {
    aobj.insertBefore(aobj.prev('.antwort:not(.delit)'))
  } else {
    aobj.insertAfter(aobj.next('.antwort:not(.delit)'))
  }
  unsavedAntworten = 1
  $('#antwortensave').removeClass('disabled')
  resetReihungAntworten()
}
function erhInfAufgabenClick(e){
  if(unsavedEIAufgabe==1) {
    if(confirm('Ungespeicherte Daten! Wollen Sie trotzdem die Datei wechseln?')) {
      unsavedEIAufgabe=0
    } else {
      $(this).blur()
    }
  }
}
function erhInfAufgabenSpeichernClick(e){
  console.log({ csrfmiddlewaretoken: csrf , save: 'ErhInfAufgaben' , pk: $('#erhinfaufgaben option:selected').data('pk') , start_Aufgabe: durationToSeconds($('#start_ErhInfAufgaben').val()) , stop_Aufgabe: durationToSeconds($('#stop_ErhInfAufgaben').val()) })
  $.post('/bearbeiten/'+$('input[name="von_Inf"]').first().val()+'/'+$('input[name="zu_Aufgabe"]').first().val()+'/',{ csrfmiddlewaretoken: csrf , save: 'ErhInfAufgaben' , pk: $('#erhinfaufgaben option:selected').data('pk') , start_Aufgabe: durationToSeconds($('#start_ErhInfAufgaben').val()) , stop_Aufgabe: durationToSeconds($('#stop_ErhInfAufgaben').val()) }, function(d) {
    unsavedEIAufgabe = 0
    $('#audioplayer').html(d)
    setAudioPlayer()
  }).fail(function(d) {
    alert( "error" )
    console.log(d)
  })
}
function antwortenSpeichernClick(e){
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
      informantenAntwortenUpdate()
      tagEbenenOptionUpdateAll()
      familienHinzufuegenKnopfUpdate()
    }).fail(function(d) {
      alert( "error" )
      console.log(d)
    })
  }
}
function antwortLoeschenClick(e){
  if(confirm('Soll diese "Antwort" tatsächlich gelöscht werden?')) {
    var aselobj = $(this).parents('.antwort')
    if(aselobj.find('input[name="id_Antwort"]').val() == 0) {
      aselobj.remove()
    } else {
      aselobj.addClass('delit')
    }
  }
  formularChanged()
  resetReihungAntworten()
}
function antwortAudioBereichChange(e){
  $(this).val(secondsToDuration(durationToSeconds($(this).val())))
  setAudioMarks()
}
function ausgewaehlteAufgabeChange(e){
  $('#selaufgabe').submit()
}
function erhInfAufgabenChange(e){
  $(this).val(secondsToDuration(durationToSeconds($(this).val())))
  $('#aufgabenprogress .pb-starttime').html(secondsToDuration(durationToSeconds($('#start_ErhInfAufgaben').val())))
  $('#aufgabenprogress .pb-endtime').html(secondsToDuration(durationToSeconds($('#stop_ErhInfAufgaben').val())))
  erhInfAufgabeChanged()
  setAudioMarks()
}


/* Funktionen */
function formularChanged(){
  unsavedAntworten = 1
  $('#antwortensave').removeClass('disabled')
}
function erhInfAufgabeChanged(){
  unsavedEIAufgabe=1
  $('#eiaufgsave').removeClass('disabled')
}
function informantenAntwortenUpdate() {
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
