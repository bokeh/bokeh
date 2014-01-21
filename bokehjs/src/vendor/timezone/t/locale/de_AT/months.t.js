#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/de_AT"));
  //de_AT abbreviated months
  equal(tz("2000-01-01", "%b", "de_AT"), "Jän", "Jan");
  equal(tz("2000-02-01", "%b", "de_AT"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "de_AT"), "Mär", "Mar");
  equal(tz("2000-04-01", "%b", "de_AT"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "de_AT"), "Mai", "May");
  equal(tz("2000-06-01", "%b", "de_AT"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "de_AT"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "de_AT"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "de_AT"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "de_AT"), "Okt", "Oct");
  equal(tz("2000-11-01", "%b", "de_AT"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "de_AT"), "Dez", "Dec");

  // de_AT months
  equal(tz("2000-01-01", "%B", "de_AT"), "Jänner", "January");
  equal(tz("2000-02-01", "%B", "de_AT"), "Feber", "February");
  equal(tz("2000-03-01", "%B", "de_AT"), "März", "March");
  equal(tz("2000-04-01", "%B", "de_AT"), "April", "April");
  equal(tz("2000-05-01", "%B", "de_AT"), "Mai", "May");
  equal(tz("2000-06-01", "%B", "de_AT"), "Juni", "June");
  equal(tz("2000-07-01", "%B", "de_AT"), "Juli", "July");
  equal(tz("2000-08-01", "%B", "de_AT"), "August", "August");
  equal(tz("2000-09-01", "%B", "de_AT"), "September", "September");
  equal(tz("2000-10-01", "%B", "de_AT"), "Oktober", "October");
  equal(tz("2000-11-01", "%B", "de_AT"), "November", "November");
  equal(tz("2000-12-01", "%B", "de_AT"), "Dezember", "December");
});
