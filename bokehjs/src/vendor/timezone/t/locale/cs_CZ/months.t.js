#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/cs_CZ"));
  //cs_CZ abbreviated months
  equal(tz("2000-01-01", "%b", "cs_CZ"), "led", "Jan");
  equal(tz("2000-02-01", "%b", "cs_CZ"), "úno", "Feb");
  equal(tz("2000-03-01", "%b", "cs_CZ"), "bře", "Mar");
  equal(tz("2000-04-01", "%b", "cs_CZ"), "dub", "Apr");
  equal(tz("2000-05-01", "%b", "cs_CZ"), "kvě", "May");
  equal(tz("2000-06-01", "%b", "cs_CZ"), "čen", "Jun");
  equal(tz("2000-07-01", "%b", "cs_CZ"), "čec", "Jul");
  equal(tz("2000-08-01", "%b", "cs_CZ"), "srp", "Aug");
  equal(tz("2000-09-01", "%b", "cs_CZ"), "zář", "Sep");
  equal(tz("2000-10-01", "%b", "cs_CZ"), "říj", "Oct");
  equal(tz("2000-11-01", "%b", "cs_CZ"), "lis", "Nov");
  equal(tz("2000-12-01", "%b", "cs_CZ"), "pro", "Dec");

  // cs_CZ months
  equal(tz("2000-01-01", "%B", "cs_CZ"), "leden", "January");
  equal(tz("2000-02-01", "%B", "cs_CZ"), "únor", "February");
  equal(tz("2000-03-01", "%B", "cs_CZ"), "březen", "March");
  equal(tz("2000-04-01", "%B", "cs_CZ"), "duben", "April");
  equal(tz("2000-05-01", "%B", "cs_CZ"), "květen", "May");
  equal(tz("2000-06-01", "%B", "cs_CZ"), "červen", "June");
  equal(tz("2000-07-01", "%B", "cs_CZ"), "červenec", "July");
  equal(tz("2000-08-01", "%B", "cs_CZ"), "srpen", "August");
  equal(tz("2000-09-01", "%B", "cs_CZ"), "září", "September");
  equal(tz("2000-10-01", "%B", "cs_CZ"), "říjen", "October");
  equal(tz("2000-11-01", "%B", "cs_CZ"), "listopad", "November");
  equal(tz("2000-12-01", "%B", "cs_CZ"), "prosinec", "December");
});
