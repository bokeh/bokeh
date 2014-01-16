#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/el_GR"));
  // el_GR abbreviated days of week
  equal(tz("2006-01-01", "%a", "el_GR"), "Κυρ", "Sun");
  equal(tz("2006-01-02", "%a", "el_GR"), "Δευ", "Mon");
  equal(tz("2006-01-03", "%a", "el_GR"), "Τρι", "Tue");
  equal(tz("2006-01-04", "%a", "el_GR"), "Τετ", "Wed");
  equal(tz("2006-01-05", "%a", "el_GR"), "Πεμ", "Thu");
  equal(tz("2006-01-06", "%a", "el_GR"), "Παρ", "Fri");
  equal(tz("2006-01-07", "%a", "el_GR"), "Σαβ", "Sat");

  // el_GR days of week
  equal(tz("2006-01-01", "%A", "el_GR"), "Κυριακή", "Sunday");
  equal(tz("2006-01-02", "%A", "el_GR"), "Δευτέρα", "Monday");
  equal(tz("2006-01-03", "%A", "el_GR"), "Τρίτη", "Tuesday");
  equal(tz("2006-01-04", "%A", "el_GR"), "Τετάρτη", "Wednesday");
  equal(tz("2006-01-05", "%A", "el_GR"), "Πέμπτη", "Thursday");
  equal(tz("2006-01-06", "%A", "el_GR"), "Παρασκευή", "Friday");
  equal(tz("2006-01-07", "%A", "el_GR"), "Σάββατο", "Saturday");
});
