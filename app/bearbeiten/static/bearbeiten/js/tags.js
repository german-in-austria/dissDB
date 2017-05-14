/* On */
function closeTagSelect(e) {	/* Tag Select Fenster schließen wenn ausserhalb geklickt wird */
	var container = $(".seltags")
	if (!container.is(e.target) && container.has(e.target).length === 0) { container.remove(); }
}
function openNewTagSelectClick(e){
	var apos = $(this).position()
	$(this).after('<div class="tags seltags newtag" style="left:'+apos.left+'px;">'+$('#'+$(this).data('popup')).html()+'</div>')
	$(this).blur()
}
function moveTagLeftRightClick(e){
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
}
function openTagPresetSelectClick(e){
	var apos = $(this).position()
	$(this).after('<div class="tags seltags pretags" style="left:'+apos.left+'px;">'+$('#pretags').html()+'</div>')
	$(this).blur()
}
function openChangeTagSelectClick(e){
	var apos = $(this).position()
	$(this).after('<div class="tags seltags edittag" style="left:'+apos.left+'px;" data-reihung="'+$(this).data('reihung')+'">'+$('#'+$(this).data('popup')).html()+'</div>')
	$('.seltags').find('.ptagsbtn[data-pk="' + $(this).data('id_tag') + '"]').addClass('active')
	$(this).blur()
}
function tagAendernLoeschenClick(e){
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
}
function tagHinzufuegenClick(e){
	var aselobj = $(this).parents('.seltags')
	$(this).parents('.reihung-tags').find('.ant-ntag').before('<button class="ant-tag" data-popup="'+$(this).parents('.reihung-tags').find('.ant-ntag').data('popup')+'" data-id_tag="'+$(this).data('pk')+'" data-pk="0">'+$(this).html()+'</button>')
	aselobj.remove()
	resetReihungTags()
	unsavedAntworten = 1
	$('#antwortensave').removeClass('disabled')
}
function tagPresetHinzufuegenClick(e){
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
}
function addTagLineClick(e){
	$(this).parents('.add-tag-line-line').before($(this).parents('.tag-forms').find('div.tag-vorlage').html())
}
function tagEbeneChange(e){
	tagEbeneColor(this)
	tagEbenenOptionUpdateCluster(this)
}

/* Funktionen */
function resetReihungTags() {
	$('.reihung-tags').each(function(){
		var areihung = 1
		$(this).find('.ant-tag:not(.delit)').each(function(){
			$(this).data('reihung',areihung)
			areihung+=1
		})
	})
}
function getTagsObject(athis) {
	var tags = []
	athis.find('.ant-tag').each(function() {
		tags.push({'reihung':$(this).data('reihung') , 'id_tag':$(this).data('id_tag') , 'pk':$(this).data('pk'), 'id_TagEbene':$(this).parents('.tag-line').find('select.tagebene').val() })
	})
	return tags
}
function checkEbenen(){
	var isok = true
	$('.tag-forms>.tag-line select.tagebene').each(function() {
		if($(this).val()==0) {
			if ($(this).parents('.tag-line').find('.ant-tag').length>0) {
				if(!confirm('Sollen alle Tags der Ebenen ohne Auswahl gelöscht werden?')) {
					isok = false
				}
				return false
			}
		}
	})
	return isok
}
function tagEbeneColor(athis) {
	if($(athis).val()==0) {
		$(athis).parents('.tag-line').css('background-color','#fcc')
	} else {
		$(athis).parents('.tag-line').css('background-color','transparent')
	}
}
function tagEbenenOptionUpdateAll() {
	$('.tag-forms select.tagebene').each(function(){
		tagEbenenOptionUpdate(this)
	})
}
function tagEbenenOptionUpdateCluster(athis) {
	$(athis).parents('.tag-forms').find('select.tagebene').each(function(){
		tagEbenenOptionUpdate(this)
	})
}
function tagEbenenOptionUpdate(athis) {
	var notThis = $(athis).parents('.tag-forms').find('select.tagebene').not($(athis))
	$(athis).find('option').removeAttr('disabled').each(function(){
		var asVal = $(this).val()
		if(asVal != 0) {
			if(notThis.filter(function(){return this.value==asVal}).length>0) {
				$(this).attr('disabled','disabled')
			}
		}
	})
}
function familienHinzufuegenKnopfUpdate() {
	$('button.ant-ftag').remove()
	$('.r-tag-familie-pchilds').append('<button class="ant-ftag"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>')
}
