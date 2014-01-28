#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_SV"));
  //es_SV abbreviated months
  equal(tz("2000-01-01", "%b", "es_SV"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_SV"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_SV"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_SV"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_SV"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_SV"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_SV"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_SV"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_SV"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_SV"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_SV"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_SV"), "dic", "Dec");

  // es_SV months
  equal(tz("2000-01-01", "%B", "es_SV"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_SV"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_SV"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_SV"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_SV"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_SV"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_SV"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_SV"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_SV"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_SV"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_SV"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_SV"), "diciembre", "December");
});
