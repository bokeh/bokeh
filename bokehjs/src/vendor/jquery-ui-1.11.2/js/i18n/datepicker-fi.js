/* Finnish initialisation for the jQuery UI date picker plugin. */
/* Written by Harri Kilpiö (harrikilpio@gmail.com). */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "../datepicker" ], factory );
	} else {

		// Browser globals
		factory( jQuery.datepicker );
	}
}(function( datepicker ) {

datepicker.regional['fi'] = {
	closeText: 'Sulje',
	prevText: '&#xAB;Edellinen',
	nextText: 'Seuraava&#xBB;',
	currentText: 'Tänään',
	monthNames: ['Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kesäkuu',
	'Heinäkuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu'],
	monthNamesShort: ['Tammi','Helmi','Maalis','Huhti','Touko','Kesä',
	'Heinä','Elo','Syys','Loka','Marras','Joulu'],
	dayNamesShort: ['Su','Ma','Ti','Ke','To','Pe','La'],
	dayNames: ['Sunnuntai','Maanantai','Tiistai','Keskiviikko','Torstai','Perjantai','Lauantai'],
	dayNamesMin: ['Su','Ma','Ti','Ke','To','Pe','La'],
	weekHeader: 'Vk',
	dateFormat: 'd.m.yy',
	firstDay: 1,
	isRTL: false,
	showMonthAfterYear: false,
	yearSuffix: ''};
datepicker.setDefaults(datepicker.regional['fi']);

return datepicker.regional['fi'];

}));
