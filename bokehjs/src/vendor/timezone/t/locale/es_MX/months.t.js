#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_MX"));
  //es_MX abbreviated months
  equal(tz("2000-01-01", "%b", "es_MX"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_MX"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_MX"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_MX"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_MX"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_MX"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_MX"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_MX"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_MX"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_MX"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_MX"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_MX"), "dic", "Dec");

  // es_MX months
  equal(tz("2000-01-01", "%B", "es_MX"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_MX"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_MX"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_MX"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_MX"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_MX"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_MX"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_MX"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_MX"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_MX"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_MX"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_MX"), "diciembre", "December");
});
