#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_VE"));
  //es_VE abbreviated months
  equal(tz("2000-01-01", "%b", "es_VE"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_VE"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_VE"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_VE"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_VE"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_VE"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_VE"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_VE"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_VE"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_VE"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_VE"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_VE"), "dic", "Dec");

  // es_VE months
  equal(tz("2000-01-01", "%B", "es_VE"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_VE"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_VE"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_VE"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_VE"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_VE"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_VE"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_VE"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_VE"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_VE"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_VE"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_VE"), "diciembre", "December");
});
