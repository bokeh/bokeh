#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/sv_SE"));
  //sv_SE abbreviated months
  equal(tz("2000-01-01", "%b", "sv_SE"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "sv_SE"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "sv_SE"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "sv_SE"), "apr", "Apr");
  equal(tz("2000-05-01", "%b", "sv_SE"), "maj", "May");
  equal(tz("2000-06-01", "%b", "sv_SE"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "sv_SE"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "sv_SE"), "aug", "Aug");
  equal(tz("2000-09-01", "%b", "sv_SE"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "sv_SE"), "okt", "Oct");
  equal(tz("2000-11-01", "%b", "sv_SE"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "sv_SE"), "dec", "Dec");

  // sv_SE months
  equal(tz("2000-01-01", "%B", "sv_SE"), "januari", "January");
  equal(tz("2000-02-01", "%B", "sv_SE"), "februari", "February");
  equal(tz("2000-03-01", "%B", "sv_SE"), "mars", "March");
  equal(tz("2000-04-01", "%B", "sv_SE"), "april", "April");
  equal(tz("2000-05-01", "%B", "sv_SE"), "maj", "May");
  equal(tz("2000-06-01", "%B", "sv_SE"), "juni", "June");
  equal(tz("2000-07-01", "%B", "sv_SE"), "juli", "July");
  equal(tz("2000-08-01", "%B", "sv_SE"), "augusti", "August");
  equal(tz("2000-09-01", "%B", "sv_SE"), "september", "September");
  equal(tz("2000-10-01", "%B", "sv_SE"), "oktober", "October");
  equal(tz("2000-11-01", "%B", "sv_SE"), "november", "November");
  equal(tz("2000-12-01", "%B", "sv_SE"), "december", "December");
});
