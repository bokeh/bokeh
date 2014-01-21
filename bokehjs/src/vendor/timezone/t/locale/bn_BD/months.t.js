#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/bn_BD"));
  //bn_BD abbreviated months
  equal(tz("2000-01-01", "%b", "bn_BD"), "জানু", "Jan");
  equal(tz("2000-02-01", "%b", "bn_BD"), "ফেব্রু", "Feb");
  equal(tz("2000-03-01", "%b", "bn_BD"), "মার্চ", "Mar");
  equal(tz("2000-04-01", "%b", "bn_BD"), "এপ্রি", "Apr");
  equal(tz("2000-05-01", "%b", "bn_BD"), "মে", "May");
  equal(tz("2000-06-01", "%b", "bn_BD"), "জুন", "Jun");
  equal(tz("2000-07-01", "%b", "bn_BD"), "জুল", "Jul");
  equal(tz("2000-08-01", "%b", "bn_BD"), "আগ", "Aug");
  equal(tz("2000-09-01", "%b", "bn_BD"), "সেপ্টে", "Sep");
  equal(tz("2000-10-01", "%b", "bn_BD"), "অক্টো", "Oct");
  equal(tz("2000-11-01", "%b", "bn_BD"), "নভে", "Nov");
  equal(tz("2000-12-01", "%b", "bn_BD"), "ডিসে", "Dec");

  // bn_BD months
  equal(tz("2000-01-01", "%B", "bn_BD"), "জানুয়ারি", "January");
  equal(tz("2000-02-01", "%B", "bn_BD"), "ফেব্রুয়ারি", "February");
  equal(tz("2000-03-01", "%B", "bn_BD"), "মার্চ", "March");
  equal(tz("2000-04-01", "%B", "bn_BD"), "এপ্রিল", "April");
  equal(tz("2000-05-01", "%B", "bn_BD"), "মে", "May");
  equal(tz("2000-06-01", "%B", "bn_BD"), "জুন", "June");
  equal(tz("2000-07-01", "%B", "bn_BD"), "জুলাই", "July");
  equal(tz("2000-08-01", "%B", "bn_BD"), "আগস্ট", "August");
  equal(tz("2000-09-01", "%B", "bn_BD"), "সেপ্টেম্বর", "September");
  equal(tz("2000-10-01", "%B", "bn_BD"), "অক্টোবর", "October");
  equal(tz("2000-11-01", "%B", "bn_BD"), "নভেম্বর", "November");
  equal(tz("2000-12-01", "%B", "bn_BD"), "ডিসেম্বর", "December");
});
