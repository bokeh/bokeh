#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_NI"));
  //es_NI abbreviated months
  equal(tz("2000-01-01", "%b", "es_NI"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_NI"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_NI"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_NI"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_NI"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_NI"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_NI"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_NI"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_NI"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_NI"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_NI"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_NI"), "dic", "Dec");

  // es_NI months
  equal(tz("2000-01-01", "%B", "es_NI"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_NI"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_NI"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_NI"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_NI"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_NI"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_NI"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_NI"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_NI"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_NI"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_NI"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_NI"), "diciembre", "December");
});
