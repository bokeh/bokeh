#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ca_ES"));
  //ca_ES abbreviated months
  equal(tz("2000-01-01", "%b", "ca_ES"), "gen", "Jan");
  equal(tz("2000-02-01", "%b", "ca_ES"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "ca_ES"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "ca_ES"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "ca_ES"), "mai", "May");
  equal(tz("2000-06-01", "%b", "ca_ES"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "ca_ES"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "ca_ES"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "ca_ES"), "set", "Sep");
  equal(tz("2000-10-01", "%b", "ca_ES"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "ca_ES"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "ca_ES"), "des", "Dec");

  // ca_ES months
  equal(tz("2000-01-01", "%B", "ca_ES"), "gener", "January");
  equal(tz("2000-02-01", "%B", "ca_ES"), "febrer", "February");
  equal(tz("2000-03-01", "%B", "ca_ES"), "març", "March");
  equal(tz("2000-04-01", "%B", "ca_ES"), "abril", "April");
  equal(tz("2000-05-01", "%B", "ca_ES"), "maig", "May");
  equal(tz("2000-06-01", "%B", "ca_ES"), "juny", "June");
  equal(tz("2000-07-01", "%B", "ca_ES"), "juliol", "July");
  equal(tz("2000-08-01", "%B", "ca_ES"), "agost", "August");
  equal(tz("2000-09-01", "%B", "ca_ES"), "setembre", "September");
  equal(tz("2000-10-01", "%B", "ca_ES"), "octubre", "October");
  equal(tz("2000-11-01", "%B", "ca_ES"), "novembre", "November");
  equal(tz("2000-12-01", "%B", "ca_ES"), "desembre", "December");
});
