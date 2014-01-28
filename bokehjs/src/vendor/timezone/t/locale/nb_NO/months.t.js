#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/nb_NO"));
  //nb_NO abbreviated months
  equal(tz("2000-01-01", "%b", "nb_NO"), "jan.", "Jan");
  equal(tz("2000-02-01", "%b", "nb_NO"), "feb.", "Feb");
  equal(tz("2000-03-01", "%b", "nb_NO"), "mars", "Mar");
  equal(tz("2000-04-01", "%b", "nb_NO"), "april", "Apr");
  equal(tz("2000-05-01", "%b", "nb_NO"), "mai", "May");
  equal(tz("2000-06-01", "%b", "nb_NO"), "juni", "Jun");
  equal(tz("2000-07-01", "%b", "nb_NO"), "juli", "Jul");
  equal(tz("2000-08-01", "%b", "nb_NO"), "aug.", "Aug");
  equal(tz("2000-09-01", "%b", "nb_NO"), "sep.", "Sep");
  equal(tz("2000-10-01", "%b", "nb_NO"), "okt.", "Oct");
  equal(tz("2000-11-01", "%b", "nb_NO"), "nov.", "Nov");
  equal(tz("2000-12-01", "%b", "nb_NO"), "des.", "Dec");

  // nb_NO months
  equal(tz("2000-01-01", "%B", "nb_NO"), "januar", "January");
  equal(tz("2000-02-01", "%B", "nb_NO"), "februar", "February");
  equal(tz("2000-03-01", "%B", "nb_NO"), "mars", "March");
  equal(tz("2000-04-01", "%B", "nb_NO"), "april", "April");
  equal(tz("2000-05-01", "%B", "nb_NO"), "mai", "May");
  equal(tz("2000-06-01", "%B", "nb_NO"), "juni", "June");
  equal(tz("2000-07-01", "%B", "nb_NO"), "juli", "July");
  equal(tz("2000-08-01", "%B", "nb_NO"), "august", "August");
  equal(tz("2000-09-01", "%B", "nb_NO"), "september", "September");
  equal(tz("2000-10-01", "%B", "nb_NO"), "oktober", "October");
  equal(tz("2000-11-01", "%B", "nb_NO"), "november", "November");
  equal(tz("2000-12-01", "%B", "nb_NO"), "desember", "December");
});
