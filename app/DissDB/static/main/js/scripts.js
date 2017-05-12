(function($){jQuery(document).ready(function($){

});})(jQuery);

/* Funktionen */
function post(path, params, target, method) { method = method || "post"; var form = document.createElement("form"); form.setAttribute("method", method); form.setAttribute("action", path); if(target) { form.setAttribute("target", target); }; for(var key in params) { if(params.hasOwnProperty(key)) { var hiddenField = document.createElement("input"); hiddenField.setAttribute("type", "hidden"); hiddenField.setAttribute("name", key); hiddenField.setAttribute("value", params[key]); form.appendChild(hiddenField); };}; document.body.appendChild(form); form.submit(); };
