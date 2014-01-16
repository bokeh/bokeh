#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/fi_FI"));
  //fi_FI abbreviated months
  equal(tz("2000-01-01", "%b", "fi_FI"), "tammi ", "Jan");
  equal(tz("2000-02-01", "%b", "fi_FI"), "helmi ", "Feb");
  equal(tz("2000-03-01", "%b", "fi_FI"), "maalis", "Mar");
  equal(tz("2000-04-01", "%b", "fi_FI"), "huhti ", "Apr");
  equal(tz("2000-05-01", "%b", "fi_FI"), "touko ", "May");
  equal(tz("2000-06-01", "%b", "fi_FI"), "kesä  ", "Jun");
  equal(tz("2000-07-01", "%b", "fi_FI"), "heinä ", "Jul");
  equal(tz("2000-08-01", "%b", "fi_FI"), "elo   ", "Aug");
  equal(tz("2000-09-01", "%b", "fi_FI"), "syys  ", "Sep");
  equal(tz("2000-10-01", "%b", "fi_FI"), "loka  ", "Oct");
  equal(tz("2000-11-01", "%b", "fi_FI"), "marras", "Nov");
  equal(tz("2000-12-01", "%b", "fi_FI"), "joulu ", "Dec");

  // fi_FI months
  equal(tz("2000-01-01", "%B", "fi_FI"), "tammikuu", "January");
  equal(tz("2000-02-01", "%B", "fi_FI"), "helmikuu", "February");
  equal(tz("2000-03-01", "%B", "fi_FI"), "maaliskuu", "March");
  equal(tz("2000-04-01", "%B", "fi_FI"), "huhtikuu", "April");
  equal(tz("2000-05-01", "%B", "fi_FI"), "toukokuu", "May");
  equal(tz("2000-06-01", "%B", "fi_FI"), "kesäkuu", "June");
  equal(tz("2000-07-01", "%B", "fi_FI"), "heinäkuu", "July");
  equal(tz("2000-08-01", "%B", "fi_FI"), "elokuu", "August");
  equal(tz("2000-09-01", "%B", "fi_FI"), "syyskuu", "September");
  equal(tz("2000-10-01", "%B", "fi_FI"), "lokakuu", "October");
  equal(tz("2000-11-01", "%B", "fi_FI"), "marraskuu", "November");
  equal(tz("2000-12-01", "%B", "fi_FI"), "joulukuu", "December");
});
