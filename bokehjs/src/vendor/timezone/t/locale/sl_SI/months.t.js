#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/sl_SI"));
  //sl_SI abbreviated months
  equal(tz("2000-01-01", "%b", "sl_SI"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "sl_SI"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "sl_SI"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "sl_SI"), "apr", "Apr");
  equal(tz("2000-05-01", "%b", "sl_SI"), "maj", "May");
  equal(tz("2000-06-01", "%b", "sl_SI"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "sl_SI"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "sl_SI"), "avg", "Aug");
  equal(tz("2000-09-01", "%b", "sl_SI"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "sl_SI"), "okt", "Oct");
  equal(tz("2000-11-01", "%b", "sl_SI"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "sl_SI"), "dec", "Dec");

  // sl_SI months
  equal(tz("2000-01-01", "%B", "sl_SI"), "januar", "January");
  equal(tz("2000-02-01", "%B", "sl_SI"), "februar", "February");
  equal(tz("2000-03-01", "%B", "sl_SI"), "marec", "March");
  equal(tz("2000-04-01", "%B", "sl_SI"), "april", "April");
  equal(tz("2000-05-01", "%B", "sl_SI"), "maj", "May");
  equal(tz("2000-06-01", "%B", "sl_SI"), "junij", "June");
  equal(tz("2000-07-01", "%B", "sl_SI"), "julij", "July");
  equal(tz("2000-08-01", "%B", "sl_SI"), "avgust", "August");
  equal(tz("2000-09-01", "%B", "sl_SI"), "september", "September");
  equal(tz("2000-10-01", "%B", "sl_SI"), "oktober", "October");
  equal(tz("2000-11-01", "%B", "sl_SI"), "november", "November");
  equal(tz("2000-12-01", "%B", "sl_SI"), "december", "December");
});
