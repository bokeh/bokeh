#!/usr/bin/env node
require("../proof")(16, function (equal, tz, utc) {
  equal(tz(utc(2011, 0, 1, 0), "%H"), "00", "military hours padded midnight");
  equal(tz(utc(2011, 0, 1, 1), "%H"), "01", "military hours padded AM");
  equal(tz(utc(2011, 0, 1, 12), "%H"), "12", "military hours padded noon");
  equal(tz(utc(2011, 0, 1, 13), "%H"), "13", "military hours padded PM");
  equal(tz(utc(2011, 0, 1, 0), "%l"), "12", "dial hours midnight");
  equal(tz(utc(2011, 0, 1, 1), "%l"), " 1", "dial hours AM");
  equal(tz(utc(2011, 0, 1, 12), "%l"), "12", "dial hours noon");
  equal(tz(utc(2011, 0, 1, 13), "%l"), " 1", "dial hours PM");
  equal(tz(utc(2011, 0, 1, 0), "%I"), "12", "dial hours padded midnight");
  equal(tz(utc(2011, 0, 1, 1), "%I"), "01", "dial hours padded AM");
  equal(tz(utc(2011, 0, 1, 12), "%I"), "12", "dial hours padded noon");
  equal(tz(utc(2011, 0, 1, 13), "%I"), "01", "dial hours padded PM");
  equal(tz(utc(2011, 0, 1, 0), "%k"), " 0", "military hours midnight");
  equal(tz(utc(2011, 0, 1, 1), "%k"), " 1", "military hours AM");
  equal(tz(utc(2011, 0, 1, 12), "%k"), "12", "military hours noon");
  equal(tz(utc(2011, 0, 1, 13), "%k"), "13", "military hours PM");
});
