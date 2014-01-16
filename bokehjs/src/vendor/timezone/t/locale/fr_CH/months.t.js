#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/fr_CH"));
  //fr_CH abbreviated months
  equal(tz("2000-01-01", "%b", "fr_CH"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "fr_CH"), "fév", "Feb");
  equal(tz("2000-03-01", "%b", "fr_CH"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "fr_CH"), "avr", "Apr");
  equal(tz("2000-05-01", "%b", "fr_CH"), "mai", "May");
  equal(tz("2000-06-01", "%b", "fr_CH"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "fr_CH"), "jui", "Jul");
  equal(tz("2000-08-01", "%b", "fr_CH"), "aoû", "Aug");
  equal(tz("2000-09-01", "%b", "fr_CH"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "fr_CH"), "oct", "Oct");
  equal(tz("2000-11-01", "%b", "fr_CH"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "fr_CH"), "déc", "Dec");

  // fr_CH months
  equal(tz("2000-01-01", "%B", "fr_CH"), "janvier", "January");
  equal(tz("2000-02-01", "%B", "fr_CH"), "février", "February");
  equal(tz("2000-03-01", "%B", "fr_CH"), "mars", "March");
  equal(tz("2000-04-01", "%B", "fr_CH"), "avril", "April");
  equal(tz("2000-05-01", "%B", "fr_CH"), "mai", "May");
  equal(tz("2000-06-01", "%B", "fr_CH"), "juin", "June");
  equal(tz("2000-07-01", "%B", "fr_CH"), "juillet", "July");
  equal(tz("2000-08-01", "%B", "fr_CH"), "août", "August");
  equal(tz("2000-09-01", "%B", "fr_CH"), "septembre", "September");
  equal(tz("2000-10-01", "%B", "fr_CH"), "octobre", "October");
  equal(tz("2000-11-01", "%B", "fr_CH"), "novembre", "November");
  equal(tz("2000-12-01", "%B", "fr_CH"), "décembre", "December");
});
