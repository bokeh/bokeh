#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/af_ZA"));
  //af_ZA abbreviated months
  equal(tz("2000-01-01", "%b", "af_ZA"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "af_ZA"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "af_ZA"), "Mrt", "Mar");
  equal(tz("2000-04-01", "%b", "af_ZA"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "af_ZA"), "Mei", "May");
  equal(tz("2000-06-01", "%b", "af_ZA"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "af_ZA"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "af_ZA"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "af_ZA"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "af_ZA"), "Okt", "Oct");
  equal(tz("2000-11-01", "%b", "af_ZA"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "af_ZA"), "Des", "Dec");

  // af_ZA months
  equal(tz("2000-01-01", "%B", "af_ZA"), "Januarie", "January");
  equal(tz("2000-02-01", "%B", "af_ZA"), "Februarie", "February");
  equal(tz("2000-03-01", "%B", "af_ZA"), "Maart", "March");
  equal(tz("2000-04-01", "%B", "af_ZA"), "April", "April");
  equal(tz("2000-05-01", "%B", "af_ZA"), "Mei", "May");
  equal(tz("2000-06-01", "%B", "af_ZA"), "Junie", "June");
  equal(tz("2000-07-01", "%B", "af_ZA"), "Julie", "July");
  equal(tz("2000-08-01", "%B", "af_ZA"), "Augustus", "August");
  equal(tz("2000-09-01", "%B", "af_ZA"), "September", "September");
  equal(tz("2000-10-01", "%B", "af_ZA"), "Oktober", "October");
  equal(tz("2000-11-01", "%B", "af_ZA"), "November", "November");
  equal(tz("2000-12-01", "%B", "af_ZA"), "Desember", "December");
});
