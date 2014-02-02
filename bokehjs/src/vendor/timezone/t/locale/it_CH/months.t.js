#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/it_CH"));
  //it_CH abbreviated months
  equal(tz("2000-01-01", "%b", "it_CH"), "gen", "Jan");
  equal(tz("2000-02-01", "%b", "it_CH"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "it_CH"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "it_CH"), "apr", "Apr");
  equal(tz("2000-05-01", "%b", "it_CH"), "mag", "May");
  equal(tz("2000-06-01", "%b", "it_CH"), "giu", "Jun");
  equal(tz("2000-07-01", "%b", "it_CH"), "lug", "Jul");
  equal(tz("2000-08-01", "%b", "it_CH"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "it_CH"), "set", "Sep");
  equal(tz("2000-10-01", "%b", "it_CH"), "ott", "Oct");
  equal(tz("2000-11-01", "%b", "it_CH"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "it_CH"), "dic", "Dec");

  // it_CH months
  equal(tz("2000-01-01", "%B", "it_CH"), "gennaio", "January");
  equal(tz("2000-02-01", "%B", "it_CH"), "febbraio", "February");
  equal(tz("2000-03-01", "%B", "it_CH"), "marzo", "March");
  equal(tz("2000-04-01", "%B", "it_CH"), "aprile", "April");
  equal(tz("2000-05-01", "%B", "it_CH"), "maggio", "May");
  equal(tz("2000-06-01", "%B", "it_CH"), "giugno", "June");
  equal(tz("2000-07-01", "%B", "it_CH"), "luglio", "July");
  equal(tz("2000-08-01", "%B", "it_CH"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "it_CH"), "settembre", "September");
  equal(tz("2000-10-01", "%B", "it_CH"), "ottobre", "October");
  equal(tz("2000-11-01", "%B", "it_CH"), "novembre", "November");
  equal(tz("2000-12-01", "%B", "it_CH"), "dicembre", "December");
});
