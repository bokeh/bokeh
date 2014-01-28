#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_UY"));
  //es_UY abbreviated months
  equal(tz("2000-01-01", "%b", "es_UY"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_UY"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_UY"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_UY"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_UY"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_UY"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_UY"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_UY"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_UY"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_UY"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_UY"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_UY"), "dic", "Dec");

  // es_UY months
  equal(tz("2000-01-01", "%B", "es_UY"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_UY"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_UY"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_UY"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_UY"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_UY"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_UY"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_UY"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_UY"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_UY"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_UY"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_UY"), "diciembre", "December");
});
