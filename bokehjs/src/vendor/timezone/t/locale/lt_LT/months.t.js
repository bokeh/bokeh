#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/lt_LT"));
  //lt_LT abbreviated months
  equal(tz("2000-01-01", "%b", "lt_LT"), "Sau", "Jan");
  equal(tz("2000-02-01", "%b", "lt_LT"), "Vas", "Feb");
  equal(tz("2000-03-01", "%b", "lt_LT"), "Kov", "Mar");
  equal(tz("2000-04-01", "%b", "lt_LT"), "Bal", "Apr");
  equal(tz("2000-05-01", "%b", "lt_LT"), "Geg", "May");
  equal(tz("2000-06-01", "%b", "lt_LT"), "Bir", "Jun");
  equal(tz("2000-07-01", "%b", "lt_LT"), "Lie", "Jul");
  equal(tz("2000-08-01", "%b", "lt_LT"), "Rgp", "Aug");
  equal(tz("2000-09-01", "%b", "lt_LT"), "Rgs", "Sep");
  equal(tz("2000-10-01", "%b", "lt_LT"), "Spa", "Oct");
  equal(tz("2000-11-01", "%b", "lt_LT"), "Lap", "Nov");
  equal(tz("2000-12-01", "%b", "lt_LT"), "Grd", "Dec");

  // lt_LT months
  equal(tz("2000-01-01", "%B", "lt_LT"), "sausio", "January");
  equal(tz("2000-02-01", "%B", "lt_LT"), "vasario", "February");
  equal(tz("2000-03-01", "%B", "lt_LT"), "kovo", "March");
  equal(tz("2000-04-01", "%B", "lt_LT"), "balandžio", "April");
  equal(tz("2000-05-01", "%B", "lt_LT"), "gegužės", "May");
  equal(tz("2000-06-01", "%B", "lt_LT"), "birželio", "June");
  equal(tz("2000-07-01", "%B", "lt_LT"), "liepos", "July");
  equal(tz("2000-08-01", "%B", "lt_LT"), "rugpjūčio", "August");
  equal(tz("2000-09-01", "%B", "lt_LT"), "rugsėjo", "September");
  equal(tz("2000-10-01", "%B", "lt_LT"), "spalio", "October");
  equal(tz("2000-11-01", "%B", "lt_LT"), "lapkričio", "November");
  equal(tz("2000-12-01", "%B", "lt_LT"), "gruodžio", "December");
});
