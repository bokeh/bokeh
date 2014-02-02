module.exports = require("proof")(function () {
  var context = {}, __slice = [].slice, utc;
  context.readDate = function (date) {
    var match = /^(\d{4})(\d{2})(\d{2})$/.exec(date).slice(1), year = match[0], month = match[1], day = match[2];
    return new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))).getTime()
  }
  context.utc = utc = function () {
    var splat = __slice.call(arguments, 0);
    return Date.UTC.apply(Date.UTC, splat);
  }
  context.bicentennial = utc(1976, 6, 4)
  context.moonwalk = utc(1969, 6, 21, 2, 56)
  context.y2k = utc(2000, 0, 1)
  context.tz = require("timezone/index")
  return context;
});
