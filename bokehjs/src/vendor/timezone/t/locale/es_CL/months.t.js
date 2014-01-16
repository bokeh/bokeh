#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/es_CL"));
  //es_CL abbreviated months
  equal(tz("2000-01-01", "%b", "es_CL"), "ene", "Jan");
  equal(tz("2000-02-01", "%b", "es_CL"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "es_CL"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "es_CL"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "es_CL"), "may", "May");
  equal(tz("2000-06-01", "%b", "es_CL"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "es_CL"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "es_CL"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "es_CL"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "es_CL"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "es_CL"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "es_CL"), "dic", "Dec");

  // es_CL months
  equal(tz("2000-01-01", "%B", "es_CL"), "enero", "January");
  equal(tz("2000-02-01", "%B", "es_CL"), "febrero", "February");
  equal(tz("2000-03-01", "%B", "es_CL"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "es_CL"), "abril", "April");
  equal(tz("2000-05-01", "%B", "es_CL"), "mayo", "May");
  equal(tz("2000-06-01", "%B", "es_CL"), "junio", "June");
  equal(tz("2000-07-01", "%B", "es_CL"), "julio", "July");
  equal(tz("2000-08-01", "%B", "es_CL"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "es_CL"), "septiembre", "September");
  equal(tz("2000-10-01", "%B", "es_CL"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "es_CL"), "noviembre", "November");
  equal(tz("2000-12-01", "%B", "es_CL"), "diciembre", "December");
});
