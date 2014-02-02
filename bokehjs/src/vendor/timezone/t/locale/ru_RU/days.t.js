#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ru_RU"));
  // ru_RU abbreviated days of week
  equal(tz("2006-01-01", "%a", "ru_RU"), "Вс.", "Sun");
  equal(tz("2006-01-02", "%a", "ru_RU"), "Пн.", "Mon");
  equal(tz("2006-01-03", "%a", "ru_RU"), "Вт.", "Tue");
  equal(tz("2006-01-04", "%a", "ru_RU"), "Ср.", "Wed");
  equal(tz("2006-01-05", "%a", "ru_RU"), "Чт.", "Thu");
  equal(tz("2006-01-06", "%a", "ru_RU"), "Пт.", "Fri");
  equal(tz("2006-01-07", "%a", "ru_RU"), "Сб.", "Sat");

  // ru_RU days of week
  equal(tz("2006-01-01", "%A", "ru_RU"), "Воскресенье", "Sunday");
  equal(tz("2006-01-02", "%A", "ru_RU"), "Понедельник", "Monday");
  equal(tz("2006-01-03", "%A", "ru_RU"), "Вторник", "Tuesday");
  equal(tz("2006-01-04", "%A", "ru_RU"), "Среда", "Wednesday");
  equal(tz("2006-01-05", "%A", "ru_RU"), "Четверг", "Thursday");
  equal(tz("2006-01-06", "%A", "ru_RU"), "Пятница", "Friday");
  equal(tz("2006-01-07", "%A", "ru_RU"), "Суббота", "Saturday");
});
