#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/pl_PL"));
  //pl_PL abbreviated months
  equal(tz("2000-01-01", "%b", "pl_PL"), "sty", "Jan");
  equal(tz("2000-02-01", "%b", "pl_PL"), "lut", "Feb");
  equal(tz("2000-03-01", "%b", "pl_PL"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "pl_PL"), "kwi", "Apr");
  equal(tz("2000-05-01", "%b", "pl_PL"), "maj", "May");
  equal(tz("2000-06-01", "%b", "pl_PL"), "cze", "Jun");
  equal(tz("2000-07-01", "%b", "pl_PL"), "lip", "Jul");
  equal(tz("2000-08-01", "%b", "pl_PL"), "sie", "Aug");
  equal(tz("2000-09-01", "%b", "pl_PL"), "wrz", "Sep");
  equal(tz("2000-10-01", "%b", "pl_PL"), "paź", "Oct");
  equal(tz("2000-11-01", "%b", "pl_PL"), "lis", "Nov");
  equal(tz("2000-12-01", "%b", "pl_PL"), "gru", "Dec");

  // pl_PL months
  equal(tz("2000-01-01", "%B", "pl_PL"), "styczeń", "January");
  equal(tz("2000-02-01", "%B", "pl_PL"), "luty", "February");
  equal(tz("2000-03-01", "%B", "pl_PL"), "marzec", "March");
  equal(tz("2000-04-01", "%B", "pl_PL"), "kwiecień", "April");
  equal(tz("2000-05-01", "%B", "pl_PL"), "maj", "May");
  equal(tz("2000-06-01", "%B", "pl_PL"), "czerwiec", "June");
  equal(tz("2000-07-01", "%B", "pl_PL"), "lipiec", "July");
  equal(tz("2000-08-01", "%B", "pl_PL"), "sierpień", "August");
  equal(tz("2000-09-01", "%B", "pl_PL"), "wrzesień", "September");
  equal(tz("2000-10-01", "%B", "pl_PL"), "październik", "October");
  equal(tz("2000-11-01", "%B", "pl_PL"), "listopad", "November");
  equal(tz("2000-12-01", "%B", "pl_PL"), "grudzień", "December");
});
