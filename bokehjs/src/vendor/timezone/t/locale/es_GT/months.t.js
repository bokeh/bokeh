#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_GT"));
  //es_GT abbreviated months
  equal(tz("2000-01-01", "%b", "es_GT"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_GT"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_GT"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_GT"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_GT"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_GT"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_GT"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_GT"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_GT"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_GT"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_GT"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_GT"), "dic", "Dec");

  // es_GT months
  equal(tz("2000-01-01", "%B", "es_GT"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_GT"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_GT"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_GT"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_GT"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_GT"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_GT"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_GT"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_GT"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_GT"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_GT"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_GT"), "diciembre", "December");
});
