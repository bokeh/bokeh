var transitions = require("./transitions");

(function () {
  function pad (value) { return ('00' + value).slice(-2) }
  function formatOffset (offset) {
    var increment = offset / Math.abs(offset);
    var sign = offset < 0 ? '-' : '+';
    var millis, seconds, minutes, hours;
    offset = Math.abs(offset);
    offset -= (millis = offset % 1000);
    offset /= 1000;
    offset -= (seconds = offset % 60);
    offset /= 60;
    offset -= (minutes = offset % 60);
    hours = offset / 60;
    return sign + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
  }
  function iso8601 (date) {
    return new Date(date).toISOString().replace(/\..*$/, "");
  }
  function format(entry) {
    if (! entry.abbrev) entry.abbrev = entry.format;
    return formatOffset(entry.offset + (entry.save || 0)) + '/' + entry.abbrev;
  }
  var data = { zones: {}, rules: {} };
  require("../build/olson/index").forEach(function (zone) {
    for (var key in zone.zones) data.zones[key] = zone.zones[key];
    for (var key in zone.rules) data.rules[key] = zone.rules[key];
  });
  require("../build/olson/index").forEach(function (zone) {
    for (var key in zone.links) {
      if (~key.indexOf('/')) {
        data.zones[key] = data.zones[zone.links[key]];
      }
    }
  });
  var set = process.argv[2] ? [ process.argv[2] ] : Object.keys(data.zones).filter(function (e) { return ! /^Etc/.test(e) });
  for (var i = 0, length = set.length; i < length; i++) {
    try {
      var table = transitions(data, set[i]).table;
      for (var j = 1, stop = table.length - 1; j < stop; j++) {
        entry = table[j];
        console.log("%s %s %s %s", set[i], iso8601(entry.wallclock), iso8601(entry.posix), format(table[j + 1]), format(table[j]));
      }
    } catch (e) {
      console.log("Failed on " + set[i] + ".");
      throw e;
    }
  }
})();
