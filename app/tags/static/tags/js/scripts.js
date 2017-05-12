(function($){jQuery(document).ready(function($){
	/* Variablen */
	var unsavedTags = 0

	/* Inits */

	/* Tastenkürzel */
	Mousetrap.bind('ctrl+e', function(e) { return false; })

	/* On */
	/* Allgemein */
	window.onbeforeunload = function () {
		if(unsavedTags!=0) {
			return 'Es gibt noch ungespeicherte Veränderungen! Wirklich verwerfen?'
		}
	}
	/* Tag-Formular */

});})(jQuery);
