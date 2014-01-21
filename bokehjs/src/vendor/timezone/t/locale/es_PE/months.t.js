#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_PE"));
  //es_PE abbreviated months
  equal(tz("2000-01-01", "%b", "es_PE"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_PE"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_PE"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_PE"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_PE"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_PE"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_PE"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_PE"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_PE"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_PE"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_PE"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_PE"), "dic", "Dec");

  // es_PE months
  equal(tz("2000-01-01", "%B", "es_PE"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_PE"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_PE"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_PE"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_PE"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_PE"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_PE"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_PE"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_PE"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_PE"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_PE"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_PE"), "diciembre", "December");
});
