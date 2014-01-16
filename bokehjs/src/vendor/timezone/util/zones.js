function say() {
  if (arguments.length) console.log.apply(console, Array.prototype.slice.call(arguments, 0));
}

var transitions = require("./transitions");
var ABBREV = "Sun Mon Tue Wed Thu Fri Sat".split(/\s/);

function write (name, skipList, data) {
  var zone = skipList.map(function (e) {
    e = {
      wallclock: e.wallclock
    , format: e.format
    , abbrev: e.abbrev
    , offset: e.offset
    , posix: e.posix
    , save: e.save
    , rules: e.rules
    };
    if (typeof e.rules != "string") delete e.rules;
    return e;
  })
  zone.forEach(function (e) { if (e.rules == null || e.rules === false)  delete e.rules });
  var rules = {};
  zone.forEach(function (e) { if (typeof e.rules == "string") rules[e.rules] = data.rules[e.rules].slice(0) });
  for (var key in rules) rules[key].sort(function (a, b) { return b.to - a.to });
  for (var key in rules) rules[key].forEach(function (e) {
    switch (e.clock) {
    case "standard":
      if (e.saved == null) break;
      e.clock = "wallclock"
      e.time += (e.saved / 6e4);
      if (e.time / 60 > 24) {
        throw new Error("Failed: " + key + ", " + (e.time / 60));
      }
      break;
    default:
      if (!e.saved) e.saved = 0;
      break;
    }
  });
  function isLeapYear (year) {
    if (! (year % 400)) return true;
    if (! (year % 100)) return false;
    if (! (year % 4)) return true;
    return false;
  }
  const daysInMonth = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
  for (var key in rules) rules[key] = rules[key].map(function (e) {
    var date = /^(?:(\d+)|last(\w+)|(\w+)>=(\d+))$/.exec(e.day), day, i, I;
    if (date[1]) {
      day = [ 7, parseInt(date[1], 10) ];
    } else if (date[2]) {
      for (i = 0, I = ABBREV.length; i < I; i++)
        if (ABBREV[i] === date[2]) break;
      if (e.month == 1) {
        for (var year = e.from; year <= e.to; year++) {
          var fields = new Date(Date.UTC(year, 1, 29));
          if (fields.getUTCDay() == i && fields.getUTCMonth() != 1) {
            throw new Error("Last day Februrary: " + key + ", " + i + ", " + fields.getUTCDay() + ", " + fields.getUTCMonth() + ", " + year);
          }
        }
      }
      day = [ i, -daysInMonth[e.month] ];
    } else {
      for (i = 0, I = ABBREV.length; i < I; i++)
        if (ABBREV[i] === date[3]) break;
      day = [ i, parseInt(date[4], 10) ];
    }
    return {
      from: e.from
    , to: e.to
    , month: e.month
    , day: day
    , time: e.time
    , clock: e.clock
    , save: e.save
    , letter: e.letter
    , saved: e.saved
    }
  });

  var record = {
    zones: {},
    rules: rules
  };
  zone.unshift("z");
  record.zones[name] = zone;
  var fs = require("fs");
  var parts = [ "build", "timezone" ].concat(name.split(/\//)), path;
  for (var j = 0, stop = parts.length - 1; j < stop; j++) {
    path = parts.slice(0, j + 1).join("/");
    try {
      fs.statSync(path);
    } catch (e) {
      if (e.code != "ENOENT") throw e;
      fs.mkdirSync(path, 0755);
    }
  }
  fs.writeFileSync(parts.join("/") + ".js", 'module.exports=' + JSON.stringify(record), "utf8");
}

(function () {
  var data = { zones: {}, rules: {} }, skipLists = {};
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
  var set = process.argv[2] ? [ process.argv[2] ] : Object.keys(data.zones);
  for (var i = 0, length = set.length; i < length; i++) { transitions(data, set[i]) }
  for (var i = 0, length = set.length; i < length; i++) {
    try {
      write(set[i], skipLists[set[i]] = transitions(data, set[i]).skipList, data);
    } catch (e) {
      say("Failed on " + set[i] + ".");
      throw e;
    }
  }
  for (var key in data.links) {
    write(key, skipLists[data.links[key]], data);
  }
})();
