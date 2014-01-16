#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_CR"));
  //es_CR abbreviated months
  equal(tz("2000-01-01", "%b", "es_CR"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_CR"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_CR"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_CR"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_CR"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_CR"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_CR"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_CR"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_CR"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_CR"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_CR"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_CR"), "dic", "Dec");

  // es_CR months
  equal(tz("2000-01-01", "%B", "es_CR"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_CR"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_CR"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_CR"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_CR"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_CR"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_CR"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_CR"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_CR"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_CR"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_CR"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_CR"), "diciembre", "December");
});
