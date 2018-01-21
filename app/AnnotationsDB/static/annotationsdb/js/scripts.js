/* global jQuery */
/* Variablen */

(function ($) {
	jQuery(document).ready(function ($) {
		/* Inits */

		/* Tastenkürzel */

		/* On */
		/* Allgemein */

		/* Formular */
		$(document).on('change', '#seltranskript select', function () { $('#seltranskript').submit(); });
		$(document).on('click', '.lmfabc', function(e){
			e.preventDefault();
		});
	});
})(jQuery);
