/* global jQuery alert csrf newAnnotationForm rTTimer */
/* Variablen */

(function ($) {
	jQuery(document).ready(function ($) {
		/* Inits */

		/* Tastenkürzel */

		/* On */
		/* Allgemein */

		/* Formular */
		$(document).on('change', '#seltranskript select', function () { $('#seltranskript').submit(); });
		$(document).on('click', '.lmfabc', function (e) {
			e.preventDefault();
			clearTimeout(rTTimer);
			$('.lmfabc').removeClass('open');
			$(this).addClass('open');
			$.post($(this).attr('href'), { csrfmiddlewaretoken: csrf }, function (d) {
				newAnnotationForm(JSON.parse(d));
			}).fail(function (d) {
				alert('error');
				console.log(d);
			});
		});
	});
})(jQuery);
