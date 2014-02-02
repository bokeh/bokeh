#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/hu_HU"));
  //hu_HU abbreviated months
  equal(tz("2000-01-01", "%b", "hu_HU"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "hu_HU"), "febr", "Feb");
  equal(tz("2000-03-01", "%b", "hu_HU"), "márc", "Mar");
  equal(tz("2000-04-01", "%b", "hu_HU"), "ápr", "Apr");
  equal(tz("2000-05-01", "%b", "hu_HU"), "máj", "May");
  equal(tz("2000-06-01", "%b", "hu_HU"), "jún", "Jun");
  equal(tz("2000-07-01", "%b", "hu_HU"), "júl", "Jul");
  equal(tz("2000-08-01", "%b", "hu_HU"), "aug", "Aug");
  equal(tz("2000-09-01", "%b", "hu_HU"), "szept", "Sep");
  equal(tz("2000-10-01", "%b", "hu_HU"), "okt", "Oct");
  equal(tz("2000-11-01", "%b", "hu_HU"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "hu_HU"), "dec", "Dec");

  // hu_HU months
  equal(tz("2000-01-01", "%B", "hu_HU"), "január", "January");
  equal(tz("2000-02-01", "%B", "hu_HU"), "február", "February");
  equal(tz("2000-03-01", "%B", "hu_HU"), "március", "March");
  equal(tz("2000-04-01", "%B", "hu_HU"), "április", "April");
  equal(tz("2000-05-01", "%B", "hu_HU"), "május", "May");
  equal(tz("2000-06-01", "%B", "hu_HU"), "június", "June");
  equal(tz("2000-07-01", "%B", "hu_HU"), "július", "July");
  equal(tz("2000-08-01", "%B", "hu_HU"), "augusztus", "August");
  equal(tz("2000-09-01", "%B", "hu_HU"), "szeptember", "September");
  equal(tz("2000-10-01", "%B", "hu_HU"), "október", "October");
  equal(tz("2000-11-01", "%B", "hu_HU"), "november", "November");
  equal(tz("2000-12-01", "%B", "hu_HU"), "december", "December");
});
