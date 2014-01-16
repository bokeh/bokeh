#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_ES"));
  //es_ES abbreviated months
  equal(tz("2000-01-01", "%b", "es_ES"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_ES"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_ES"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_ES"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_ES"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_ES"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_ES"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_ES"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_ES"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_ES"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_ES"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_ES"), "dic", "Dec");

  // es_ES months
  equal(tz("2000-01-01", "%B", "es_ES"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_ES"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_ES"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_ES"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_ES"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_ES"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_ES"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_ES"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_ES"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_ES"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_ES"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_ES"), "diciembre", "December");
});
