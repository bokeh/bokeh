#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ru_RU"));
  //ru_RU abbreviated months
  equal(tz("2000-01-01", "%b", "ru_RU"), "янв.", "Jan");
  equal(tz("2000-02-01", "%b", "ru_RU"), "февр.", "Feb");
  equal(tz("2000-03-01", "%b", "ru_RU"), "марта", "Mar");
  equal(tz("2000-04-01", "%b", "ru_RU"), "апр.", "Apr");
  equal(tz("2000-05-01", "%b", "ru_RU"), "мая", "May");
  equal(tz("2000-06-01", "%b", "ru_RU"), "июня", "Jun");
  equal(tz("2000-07-01", "%b", "ru_RU"), "июля", "Jul");
  equal(tz("2000-08-01", "%b", "ru_RU"), "авг.", "Aug");
  equal(tz("2000-09-01", "%b", "ru_RU"), "сент.", "Sep");
  equal(tz("2000-10-01", "%b", "ru_RU"), "окт.", "Oct");
  equal(tz("2000-11-01", "%b", "ru_RU"), "нояб.", "Nov");
  equal(tz("2000-12-01", "%b", "ru_RU"), "дек.", "Dec");

  // ru_RU months
  equal(tz("2000-01-01", "%B", "ru_RU"), "Январь", "January");
  equal(tz("2000-02-01", "%B", "ru_RU"), "Февраль", "February");
  equal(tz("2000-03-01", "%B", "ru_RU"), "Март", "March");
  equal(tz("2000-04-01", "%B", "ru_RU"), "Апрель", "April");
  equal(tz("2000-05-01", "%B", "ru_RU"), "Май", "May");
  equal(tz("2000-06-01", "%B", "ru_RU"), "Июнь", "June");
  equal(tz("2000-07-01", "%B", "ru_RU"), "Июль", "July");
  equal(tz("2000-08-01", "%B", "ru_RU"), "Август", "August");
  equal(tz("2000-09-01", "%B", "ru_RU"), "Сентябрь", "September");
  equal(tz("2000-10-01", "%B", "ru_RU"), "Октябрь", "October");
  equal(tz("2000-11-01", "%B", "ru_RU"), "Ноябрь", "November");
  equal(tz("2000-12-01", "%B", "ru_RU"), "Декабрь", "December");
});
