#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/it_IT"));
  //it_IT abbreviated months
  equal(tz("2000-01-01", "%b", "it_IT"), "gen", "Jan");
  equal(tz("2000-02-01", "%b", "it_IT"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "it_IT"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "it_IT"), "apr", "Apr");
  equal(tz("2000-05-01", "%b", "it_IT"), "mag", "May");
  equal(tz("2000-06-01", "%b", "it_IT"), "giu", "Jun");
  equal(tz("2000-07-01", "%b", "it_IT"), "lug", "Jul");
  equal(tz("2000-08-01", "%b", "it_IT"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "it_IT"), "set", "Sep");
  equal(tz("2000-10-01", "%b", "it_IT"), "ott", "Oct");
  equal(tz("2000-11-01", "%b", "it_IT"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "it_IT"), "dic", "Dec");

  // it_IT months
  equal(tz("2000-01-01", "%B", "it_IT"), "gennaio", "January");
  equal(tz("2000-02-01", "%B", "it_IT"), "febbraio", "February");
  equal(tz("2000-03-01", "%B", "it_IT"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "it_IT"), "aprile", "April");
  equal(tz("2000-05-01", "%B", "it_IT"), "maggio", "May");
  equal(tz("2000-06-01", "%B", "it_IT"), "giugno", "June");
  equal(tz("2000-07-01", "%B", "it_IT"), "luglio", "July");
  equal(tz("2000-08-01", "%B", "it_IT"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "it_IT"), "settembre", "September");
  equal(tz("2000-10-01", "%B", "it_IT"), "ottobre", "October");
  equal(tz("2000-11-01", "%B", "it_IT"), "novembre", "November");
  equal(tz("2000-12-01", "%B", "it_IT"), "dicembre", "December");
});
