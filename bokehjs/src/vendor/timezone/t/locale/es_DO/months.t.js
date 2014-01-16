#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_DO"));
  //es_DO abbreviated months
  equal(tz("2000-01-01", "%b", "es_DO"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_DO"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_DO"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_DO"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_DO"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_DO"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_DO"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_DO"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_DO"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_DO"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_DO"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_DO"), "dic", "Dec");

  // es_DO months
  equal(tz("2000-01-01", "%B", "es_DO"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_DO"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_DO"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_DO"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_DO"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_DO"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_DO"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_DO"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_DO"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_DO"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_DO"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_DO"), "diciembre", "December");
});
