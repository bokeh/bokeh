#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_AR"));
  //es_AR abbreviated months
  equal(tz("2000-01-01", "%b", "es_AR"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_AR"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_AR"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_AR"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_AR"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_AR"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_AR"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_AR"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_AR"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_AR"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_AR"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_AR"), "dic", "Dec");

  // es_AR months
  equal(tz("2000-01-01", "%B", "es_AR"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_AR"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_AR"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_AR"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_AR"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_AR"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_AR"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_AR"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_AR"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_AR"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_AR"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_AR"), "diciembre", "December");
});
