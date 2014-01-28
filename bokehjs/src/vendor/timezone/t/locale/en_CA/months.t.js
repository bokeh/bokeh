#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/en_CA"));
  //en_CA abbreviated months
  equal(tz("2000-01-01", "%b", "en_CA"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "en_CA"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "en_CA"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "en_CA"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "en_CA"), "May", "May");
  equal(tz("2000-06-01", "%b", "en_CA"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "en_CA"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "en_CA"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "en_CA"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "en_CA"), "Oct", "Oct");
  equal(tz("2000-11-01", "%b", "en_CA"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "en_CA"), "Dec", "Dec");

  // en_CA months
  equal(tz("2000-01-01", "%B", "en_CA"), "January", "January");
  equal(tz("2000-02-01", "%B", "en_CA"), "February", "February");
  equal(tz("2000-03-01", "%B", "en_CA"), "March", "March");
  equal(tz("2000-04-01", "%B", "en_CA"), "April", "April");
  equal(tz("2000-05-01", "%B", "en_CA"), "May", "May");
  equal(tz("2000-06-01", "%B", "en_CA"), "June", "June");
  equal(tz("2000-07-01", "%B", "en_CA"), "July", "July");
  equal(tz("2000-08-01", "%B", "en_CA"), "August", "August");
  equal(tz("2000-09-01", "%B", "en_CA"), "September", "September");
  equal(tz("2000-10-01", "%B", "en_CA"), "October", "October");
  equal(tz("2000-11-01", "%B", "en_CA"), "November", "November");
  equal(tz("2000-12-01", "%B", "en_CA"), "December", "December");
});
