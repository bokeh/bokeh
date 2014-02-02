#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/eu_ES"));
  //eu_ES abbreviated months
  equal(tz("2000-01-01", "%b", "eu_ES"), "urt", "Jan");
  equal(tz("2000-02-01", "%b", "eu_ES"), "ots", "Feb");
  equal(tz("2000-03-01", "%b", "eu_ES"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "eu_ES"), "api", "Apr");
  equal(tz("2000-05-01", "%b", "eu_ES"), "mai", "May");
  equal(tz("2000-06-01", "%b", "eu_ES"), "eka", "Jun");
  equal(tz("2000-07-01", "%b", "eu_ES"), "uzt", "Jul");
  equal(tz("2000-08-01", "%b", "eu_ES"), "abu", "Aug");
  equal(tz("2000-09-01", "%b", "eu_ES"), "ira", "Sep");
  equal(tz("2000-10-01", "%b", "eu_ES"), "urr", "Oct");
  equal(tz("2000-11-01", "%b", "eu_ES"), "aza", "Nov");
  equal(tz("2000-12-01", "%b", "eu_ES"), "abe", "Dec");

  // eu_ES months
  equal(tz("2000-01-01", "%B", "eu_ES"), "urtarrila", "January");
  equal(tz("2000-02-01", "%B", "eu_ES"), "otsaila", "February");
  equal(tz("2000-03-01", "%B", "eu_ES"), "martxoa", "March");
  equal(tz("2000-04-01", "%B", "eu_ES"), "apirila", "April");
  equal(tz("2000-05-01", "%B", "eu_ES"), "maiatza", "May");
  equal(tz("2000-06-01", "%B", "eu_ES"), "ekaina", "June");
  equal(tz("2000-07-01", "%B", "eu_ES"), "uztaila", "July");
  equal(tz("2000-08-01", "%B", "eu_ES"), "abuztua", "August");
  equal(tz("2000-09-01", "%B", "eu_ES"), "iraila", "September");
  equal(tz("2000-10-01", "%B", "eu_ES"), "urria", "October");
  equal(tz("2000-11-01", "%B", "eu_ES"), "azaroa", "November");
  equal(tz("2000-12-01", "%B", "eu_ES"), "abendua", "December");
});
