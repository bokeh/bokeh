#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_PR"));
  //es_PR abbreviated months
  equal(tz("2000-01-01", "%b", "es_PR"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_PR"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_PR"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_PR"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_PR"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_PR"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_PR"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_PR"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_PR"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_PR"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_PR"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_PR"), "dic", "Dec");

  // es_PR months
  equal(tz("2000-01-01", "%B", "es_PR"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_PR"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_PR"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_PR"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_PR"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_PR"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_PR"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_PR"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_PR"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_PR"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_PR"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_PR"), "diciembre", "December");
});
