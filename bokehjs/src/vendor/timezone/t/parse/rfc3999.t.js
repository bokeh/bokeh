#!/usr/bin/env node
require("../proof")(18, function (equal, tz, utc) {
  equal(tz("1970-01-01"), 0, "1970");
  equal(tz("1980-01-02"), utc(1980, 0, 2), "date");
  equal(tz("1980-01-03 02:15"), Date.UTC(1980, 0, 3, 2, 15), "date and time with space no seconds");
  equal(tz("1980-01-03 02:15Z"), Date.UTC(1980, 0, 3, 2, 15), "date and time with space no seconds with Z");
  equal(tz("1980-01-03 02:15:21"), Date.UTC(1980, 0, 3, 2, 15, 21), "date and time with space");
  equal(tz("1980-01-03 02:15:21+04:32"), Date.UTC(1980, 0, 3, 2, 15, 21) - (36e5 * 4 + 6e4 * 32), "date and time with offset");
  equal(tz("1980-01-03T02:15:21"), Date.UTC(1980, 0, 3, 2, 15, 21), "date and time");
  equal(tz("1980-01-03T02:15:21Z"), Date.UTC(1980, 0, 3, 2, 15, 21), "date and time with Z");
  equal(tz("1980-01-03T02:15:21.2"), Date.UTC(1980, 0, 3, 2, 15, 21, 2), "milliseconds with space");
  equal(tz("1980-01-03 02:15:21.2"), Date.UTC(1980, 0, 3, 2, 15, 21, 2), "milliseconds");
  equal(tz("1980-01-03 02:15:21.2Z"), Date.UTC(1980, 0, 3, 2, 15, 21, 2), "milliseconds with Z");
  equal(tz("1980-01-03 02:15:21.2+10:32:31"), Date.UTC(1980, 0, 3, 2, 15, 21, 2) - (36e5 * 10 + 6e4 * 32 + 1e3 * 31), "milliseconds with offset");
  tz = tz(require("timezone/America/Detroit"));
  equal(tz("1970-01-01", "America/Detroit"), 36e5 * 5, "1970 Detroit");
  equal(tz("1976-07-04", "America/Detroit"), Date.UTC(1976, 6, 4) + 36e5 * 4, "Bicentennial Detroit");
  equal(tz("1970-01-01 00:00Z", "America/Detroit"), 0, "1970 Detroit with Z");
  equal(tz("1970-01-01 00:00-02:00", "America/Detroit"), 36e5 * 2, "1970 Detroit with offset");
  equal(tz("1999-12-31 20:00:00-04:00"), utc(2000, 0, 1), "before y2k");
  equal(typeof tz("1999-"), "function", "not really a date");
});
