#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/fr_FR"));
  //fr_FR abbreviated months
  equal(tz("2000-01-01", "%b", "fr_FR"), "janv.", "Jan");
  equal(tz("2000-02-01", "%b", "fr_FR"), "févr.", "Feb");
  equal(tz("2000-03-01", "%b", "fr_FR"), "mars", "Mar");
  equal(tz("2000-04-01", "%b", "fr_FR"), "avril", "Apr");
  equal(tz("2000-05-01", "%b", "fr_FR"), "mai", "May");
  equal(tz("2000-06-01", "%b", "fr_FR"), "juin", "Jun");
  equal(tz("2000-07-01", "%b", "fr_FR"), "juil.", "Jul");
  equal(tz("2000-08-01", "%b", "fr_FR"), "août", "Aug");
  equal(tz("2000-09-01", "%b", "fr_FR"), "sept.", "Sep");
  equal(tz("2000-10-01", "%b", "fr_FR"), "oct.", "Oct");
  equal(tz("2000-11-01", "%b", "fr_FR"), "nov.", "Nov");
  equal(tz("2000-12-01", "%b", "fr_FR"), "déc.", "Dec");

  // fr_FR months
  equal(tz("2000-01-01", "%B", "fr_FR"), "janvier", "January");
  equal(tz("2000-02-01", "%B", "fr_FR"), "février", "February");
  equal(tz("2000-03-01", "%B", "fr_FR"), "mars", "March");
  equal(tz("2000-04-01", "%B", "fr_FR"), "avril", "April");
  equal(tz("2000-05-01", "%B", "fr_FR"), "mai", "May");
  equal(tz("2000-06-01", "%B", "fr_FR"), "juin", "June");
  equal(tz("2000-07-01", "%B", "fr_FR"), "juillet", "July");
  equal(tz("2000-08-01", "%B", "fr_FR"), "août", "August");
  equal(tz("2000-09-01", "%B", "fr_FR"), "septembre", "September");
  equal(tz("2000-10-01", "%B", "fr_FR"), "octobre", "October");
  equal(tz("2000-11-01", "%B", "fr_FR"), "novembre", "November");
  equal(tz("2000-12-01", "%B", "fr_FR"), "décembre", "December");
});
