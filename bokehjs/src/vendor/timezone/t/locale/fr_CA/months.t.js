#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/fr_CA"));
  //fr_CA abbreviated months
  equal(tz("2000-01-01", "%b", "fr_CA"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "fr_CA"), "fév", "Feb");
  equal(tz("2000-03-01", "%b", "fr_CA"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "fr_CA"), "avr", "Apr");
  equal(tz("2000-05-01", "%b", "fr_CA"), "mai", "May");
  equal(tz("2000-06-01", "%b", "fr_CA"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "fr_CA"), "jui", "Jul");
  equal(tz("2000-08-01", "%b", "fr_CA"), "aoû", "Aug");
  equal(tz("2000-09-01", "%b", "fr_CA"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "fr_CA"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "fr_CA"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "fr_CA"), "déc", "Dec");

  // fr_CA months
  equal(tz("2000-01-01", "%B", "fr_CA"), "janvier", "January");
  equal(tz("2000-02-01", "%B", "fr_CA"), "février", "February");
  equal(tz("2000-03-01", "%B", "fr_CA"), "mars", "March");
  equal(tz("2000-04-01", "%B", "fr_CA"), "avril", "April");
  equal(tz("2000-05-01", "%B", "fr_CA"), "mai", "May");
  equal(tz("2000-06-01", "%B", "fr_CA"), "juin", "June");
  equal(tz("2000-07-01", "%B", "fr_CA"), "juillet", "July");
  equal(tz("2000-08-01", "%B", "fr_CA"), "août", "August");
  equal(tz("2000-09-01", "%B", "fr_CA"), "septembre", "September");
  equal(tz("2000-10-01", "%B", "fr_CA"), "octobre", "October");
  equal(tz("2000-11-01", "%B", "fr_CA"), "novembre", "November");
  equal(tz("2000-12-01", "%B", "fr_CA"), "décembre", "December");
});
