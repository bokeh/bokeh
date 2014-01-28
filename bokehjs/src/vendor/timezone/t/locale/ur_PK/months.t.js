#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ur_PK"));
  //ur_PK abbreviated months
  equal(tz("2000-01-01", "%b", "ur_PK"), "جنوري", "Jan");
  equal(tz("2000-02-01", "%b", "ur_PK"), "فروري", "Feb");
  equal(tz("2000-03-01", "%b", "ur_PK"), "مارچ", "Mar");
  equal(tz("2000-04-01", "%b", "ur_PK"), "اپريل", "Apr");
  equal(tz("2000-05-01", "%b", "ur_PK"), "مٓی", "May");
  equal(tz("2000-06-01", "%b", "ur_PK"), "جون", "Jun");
  equal(tz("2000-07-01", "%b", "ur_PK"), "جولاي", "Jul");
  equal(tz("2000-08-01", "%b", "ur_PK"), "اگست", "Aug");
  equal(tz("2000-09-01", "%b", "ur_PK"), "ستمبر", "Sep");
  equal(tz("2000-10-01", "%b", "ur_PK"), "اكتوبر", "Oct");
  equal(tz("2000-11-01", "%b", "ur_PK"), "نومبر", "Nov");
  equal(tz("2000-12-01", "%b", "ur_PK"), "دسمبر", "Dec");

  // ur_PK months
  equal(tz("2000-01-01", "%B", "ur_PK"), "جنوري", "January");
  equal(tz("2000-02-01", "%B", "ur_PK"), "فروري", "February");
  equal(tz("2000-03-01", "%B", "ur_PK"), "مارچ", "March");
  equal(tz("2000-04-01", "%B", "ur_PK"), "اپريل", "April");
  equal(tz("2000-05-01", "%B", "ur_PK"), "مٓی", "May");
  equal(tz("2000-06-01", "%B", "ur_PK"), "جون", "June");
  equal(tz("2000-07-01", "%B", "ur_PK"), "جولاي", "July");
  equal(tz("2000-08-01", "%B", "ur_PK"), "اگست", "August");
  equal(tz("2000-09-01", "%B", "ur_PK"), "ستمبر", "September");
  equal(tz("2000-10-01", "%B", "ur_PK"), "اكتوبر", "October");
  equal(tz("2000-11-01", "%B", "ur_PK"), "نومبر", "November");
  equal(tz("2000-12-01", "%B", "ur_PK"), "دسمبر", "December");
});
