#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/id_ID"));
  // id_ID abbreviated days of week
  equal(tz("2006-01-01", "%a", "id_ID"), "Min", "Sun");
  equal(tz("2006-01-02", "%a", "id_ID"), "Sen", "Mon");
  equal(tz("2006-01-03", "%a", "id_ID"), "Sel", "Tue");
  equal(tz("2006-01-04", "%a", "id_ID"), "Rab", "Wed");
  equal(tz("2006-01-05", "%a", "id_ID"), "Kam", "Thu");
  equal(tz("2006-01-06", "%a", "id_ID"), "Jum", "Fri");
  equal(tz("2006-01-07", "%a", "id_ID"), "Sab", "Sat");

  // id_ID days of week
  equal(tz("2006-01-01", "%A", "id_ID"), "Minggu", "Sunday");
  equal(tz("2006-01-02", "%A", "id_ID"), "Senin", "Monday");
  equal(tz("2006-01-03", "%A", "id_ID"), "Selasa", "Tuesday");
  equal(tz("2006-01-04", "%A", "id_ID"), "Rabu", "Wednesday");
  equal(tz("2006-01-05", "%A", "id_ID"), "Kamis", "Thursday");
  equal(tz("2006-01-06", "%A", "id_ID"), "Jumat", "Friday");
  equal(tz("2006-01-07", "%A", "id_ID"), "Sabtu", "Saturday");
});
