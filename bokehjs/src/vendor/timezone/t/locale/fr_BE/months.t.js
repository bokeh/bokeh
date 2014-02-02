#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/fr_BE"));
  //fr_BE abbreviated months
  equal(tz("2000-01-01", "%b", "fr_BE"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "fr_BE"), "fév", "Feb");
  equal(tz("2000-03-01", "%b", "fr_BE"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "fr_BE"), "avr", "Apr");
  equal(tz("2000-05-01", "%b", "fr_BE"), "mai", "May");
  equal(tz("2000-06-01", "%b", "fr_BE"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "fr_BE"), "jui", "Jul");
  equal(tz("2000-08-01", "%b", "fr_BE"), "aoû", "Aug");
  equal(tz("2000-09-01", "%b", "fr_BE"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "fr_BE"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "fr_BE"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "fr_BE"), "déc", "Dec");

  // fr_BE months
  equal(tz("2000-01-01", "%B", "fr_BE"), "janvier", "January");
  equal(tz("2000-02-01", "%B", "fr_BE"), "février", "February");
  equal(tz("2000-03-01", "%B", "fr_BE"), "mars", "March");
  equal(tz("2000-04-01", "%B", "fr_BE"), "avril", "April");
  equal(tz("2000-05-01", "%B", "fr_BE"), "mai", "May");
  equal(tz("2000-06-01", "%B", "fr_BE"), "juin", "June");
  equal(tz("2000-07-01", "%B", "fr_BE"), "juillet", "July");
  equal(tz("2000-08-01", "%B", "fr_BE"), "août", "August");
  equal(tz("2000-09-01", "%B", "fr_BE"), "septembre", "September");
  equal(tz("2000-10-01", "%B", "fr_BE"), "octobre", "October");
  equal(tz("2000-11-01", "%B", "fr_BE"), "novembre", "November");
  equal(tz("2000-12-01", "%B", "fr_BE"), "décembre", "December");
});
