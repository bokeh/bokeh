#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_CO"));
  //es_CO abbreviated months
  equal(tz("2000-01-01", "%b", "es_CO"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_CO"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_CO"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_CO"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_CO"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_CO"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_CO"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_CO"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_CO"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_CO"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_CO"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_CO"), "dic", "Dec");

  // es_CO months
  equal(tz("2000-01-01", "%B", "es_CO"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_CO"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_CO"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_CO"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_CO"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_CO"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_CO"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_CO"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_CO"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_CO"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_CO"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_CO"), "diciembre", "December");
});
