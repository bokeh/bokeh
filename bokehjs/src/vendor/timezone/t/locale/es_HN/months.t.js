#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_HN"));
  //es_HN abbreviated months
  equal(tz("2000-01-01", "%b", "es_HN"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_HN"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_HN"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_HN"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_HN"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_HN"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_HN"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_HN"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_HN"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_HN"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_HN"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_HN"), "dic", "Dec");

  // es_HN months
  equal(tz("2000-01-01", "%B", "es_HN"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_HN"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_HN"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_HN"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_HN"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_HN"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_HN"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_HN"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_HN"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_HN"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_HN"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_HN"), "diciembre", "December");
});
