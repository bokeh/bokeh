#!/usr/bin/env node

require("../proof")(11, function (tz, utc, equal) {
  var rfc822 = require("timezone/rfc822");
  equal(tz(rfc822("Sat, 13 Aug 2011 10:24:20 -0400"), "%c"), tz(Date.UTC(2011, 7, 13, 14, 24, 20), "%c"), "rfc822");
  equal(tz(rfc822("Sat, 13 Aug 2011 10:24:20 -0000"), "%c"), tz(Date.UTC(2011, 7, 13, 10, 24, 20), "%c"), "rfc822");
  try {
    rfc822("Z");
  } catch (e) {
    equal(e.message, "invalid rfc822 date", "non-sense date");
  }
  try {
    rfc822("Mon, 13 Aug 2011 10:24:20 -0000");
  } catch (e) {
    equal(e.message, "incorrect day of week for date", "day does not match");
  }
  equal(tz(rfc822("Sat, 13 Aug 2011 10:24:20 EDT"), "%c"), tz(Date.UTC(2011, 7, 13, 14, 24, 20), "%c"), "abbrev");
  equal(tz(rfc822("Thu, 13 Aug 09 10:24:20 -0400"), "%c"), tz(Date.UTC(2009, 7, 13, 14, 24, 20), "%c"), "two digit year less than 50");
  equal(tz(rfc822("Sat, 13 Aug 88 10:24:20 -0400"), "%c"), tz(Date.UTC(1988, 7, 13, 14, 24, 20), "%c"), "two digit year greater than 50");
  equal(tz(rfc822("Sat, 13 Aug 111 10:24:20 -0400"), "%c"), tz(Date.UTC(2011, 7, 13, 14, 24, 20), "%c"), "three digit year");

  equal(tz(rfc822("Sun, 1 Mar (Spring is coming soon!) 92 00:00:00 GMT")), tz("1992-03-01"), "comments");

  // The example from the RFC 822 docco.

  var military = { nato: {}, rfc822: {} }
    , index
  // , tz = require("timezone")
    , moonwalk = tz("1969-07-21 02:56")
 //  , eq = require("assert").equal
    ;

  index = 0;
  "ABCDEFGHIKLM".replace(/./g, function (ch) {
    var offset = ("0" + (++index) + "00").slice(-4);
    military.nato[ch] = "+" + offset;
    military.rfc822[ch] = "-" + offset;
  });

  index = 0;
  "NOPQRSTUVWXY".replace(/./g, function (ch) {
    var offset = ("0" + (++index) + "00").slice(-4);
     military.nato[ch] = "-" + offset;
    military.rfc822[ch] = "+" + offset;
  });

  equal(tz(rfc822("Sun, 20 Jul 1969 21:56:00 E", military.rfc822)), moonwalk, "RFC 822 military");
  equal(tz(rfc822("Sun, 20 Jul 1969 21:56:00 R", military.nato)), moonwalk, "NATO");
});
