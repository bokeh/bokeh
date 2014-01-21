#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_EC"));
  //es_EC abbreviated months
  equal(tz("2000-01-01", "%b", "es_EC"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_EC"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_EC"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_EC"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_EC"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_EC"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_EC"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_EC"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_EC"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_EC"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_EC"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_EC"), "dic", "Dec");

  // es_EC months
  equal(tz("2000-01-01", "%B", "es_EC"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_EC"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_EC"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_EC"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_EC"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_EC"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_EC"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_EC"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_EC"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_EC"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_EC"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_EC"), "diciembre", "December");
});
