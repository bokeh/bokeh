#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/de_CH"));
  //de_CH abbreviated months
  equal(tz("2000-01-01", "%b", "de_CH"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "de_CH"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "de_CH"), "Mär", "Mar");
  equal(tz("2000-04-01", "%b", "de_CH"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "de_CH"), "Mai", "May");
  equal(tz("2000-06-01", "%b", "de_CH"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "de_CH"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "de_CH"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "de_CH"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "de_CH"), "Okt", "Oct");
  equal(tz("2000-11-01", "%b", "de_CH"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "de_CH"), "Dez", "Dec");

  // de_CH months
  equal(tz("2000-01-01", "%B", "de_CH"), "Januar", "January");
  equal(tz("2000-02-01", "%B", "de_CH"), "Februar", "February");
  equal(tz("2000-03-01", "%B", "de_CH"), "März", "March");
  equal(tz("2000-04-01", "%B", "de_CH"), "April", "April");
  equal(tz("2000-05-01", "%B", "de_CH"), "Mai", "May");
  equal(tz("2000-06-01", "%B", "de_CH"), "Juni", "June");
  equal(tz("2000-07-01", "%B", "de_CH"), "Juli", "July");
  equal(tz("2000-08-01", "%B", "de_CH"), "August", "August");
  equal(tz("2000-09-01", "%B", "de_CH"), "September", "September");
  equal(tz("2000-10-01", "%B", "de_CH"), "Oktober", "October");
  equal(tz("2000-11-01", "%B", "de_CH"), "November", "November");
  equal(tz("2000-12-01", "%B", "de_CH"), "Dezember", "December");
});
