/* Esperanto initialisation for the jQuery UI date picker plugin. */
/* Written by Olivier M. (olivierweb@ifrance.com). */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "../datepicker" ], factory );
	} else {

		// Browser globals
		factory( jQuery.datepicker );
	}
}(function( datepicker ) {

datepicker.regional['eo'] = {
	closeText: 'Fermi',
	prevText: '&#x3C;Anta',
	nextText: 'Sekv&#x3E;',
	currentText: 'Nuna',
	monthNames: ['Januaro','Februaro','Marto','Aprilo','Majo','Junio',
	'Julio','Aŭgusto','Septembro','Oktobro','Novembro','Decembro'],
	monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun',
	'Jul','Aŭg','Sep','Okt','Nov','Dec'],
	dayNames: ['Dimanĉo','Lundo','Mardo','Merkredo','Ĵaŭdo','Vendredo','Sabato'],
	dayNamesShort: ['Dim','Lun','Mar','Mer','Ĵaŭ','Ven','Sab'],
	dayNamesMin: ['Di','Lu','Ma','Me','Ĵa','Ve','Sa'],
	weekHeader: 'Sb',
	dateFormat: 'dd/mm/yy',
	firstDay: 0,
	isRTL: false,
	showMonthAfterYear: false,
	yearSuffix: ''};
datepicker.setDefaults(datepicker.regional['eo']);

return datepicker.regional['eo'];

}));
