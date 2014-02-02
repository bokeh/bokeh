#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_PA"));
  //es_PA abbreviated months
  equal(tz("2000-01-01", "%b", "es_PA"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_PA"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_PA"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_PA"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_PA"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_PA"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_PA"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_PA"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_PA"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_PA"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_PA"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_PA"), "dic", "Dec");

  // es_PA months
  equal(tz("2000-01-01", "%B", "es_PA"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_PA"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_PA"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_PA"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_PA"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_PA"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_PA"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_PA"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_PA"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_PA"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_PA"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_PA"), "diciembre", "December");
});
