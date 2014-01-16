#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/bn_IN"));
  //bn_IN abbreviated months
  equal(tz("2000-01-01", "%b", "bn_IN"), "জানুয়ারি", "Jan");
  equal(tz("2000-02-01", "%b", "bn_IN"), "ফেব্রুয়ারি", "Feb");
  equal(tz("2000-03-01", "%b", "bn_IN"), "মার্চ", "Mar");
  equal(tz("2000-04-01", "%b", "bn_IN"), "এপ্রিল", "Apr");
  equal(tz("2000-05-01", "%b", "bn_IN"), "মে", "May");
  equal(tz("2000-06-01", "%b", "bn_IN"), "জুন", "Jun");
  equal(tz("2000-07-01", "%b", "bn_IN"), "জুলাই", "Jul");
  equal(tz("2000-08-01", "%b", "bn_IN"), "আগস্ট", "Aug");
  equal(tz("2000-09-01", "%b", "bn_IN"), "সেপ্টেম্বর", "Sep");
  equal(tz("2000-10-01", "%b", "bn_IN"), "অক্টোবর", "Oct");
  equal(tz("2000-11-01", "%b", "bn_IN"), "নভেম্বর", "Nov");
  equal(tz("2000-12-01", "%b", "bn_IN"), "ডিসেম্বর", "Dec");

  // bn_IN months
  equal(tz("2000-01-01", "%B", "bn_IN"), "জানুয়ারি", "January");
  equal(tz("2000-02-01", "%B", "bn_IN"), "ফেব্রুয়ারি", "February");
  equal(tz("2000-03-01", "%B", "bn_IN"), "মার্চ", "March");
  equal(tz("2000-04-01", "%B", "bn_IN"), "এপ্রিল", "April");
  equal(tz("2000-05-01", "%B", "bn_IN"), "মে", "May");
  equal(tz("2000-06-01", "%B", "bn_IN"), "জুন", "June");
  equal(tz("2000-07-01", "%B", "bn_IN"), "জুলাই", "July");
  equal(tz("2000-08-01", "%B", "bn_IN"), "আগস্ট", "August");
  equal(tz("2000-09-01", "%B", "bn_IN"), "সেপ্টেম্বর", "September");
  equal(tz("2000-10-01", "%B", "bn_IN"), "অক্টোবর", "October");
  equal(tz("2000-11-01", "%B", "bn_IN"), "নভেম্বর", "November");
  equal(tz("2000-12-01", "%B", "bn_IN"), "ডিসেম্বর", "December");
});
