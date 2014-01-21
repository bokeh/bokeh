var fs = require("fs")
  , MONTH = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(/\s+/)
  , DAY = "Sun Mon Tue Wed Thu Fri Sat".split(/\s+/)
  ;

function parseOffset (pattern, seconds) {
  var i, match, milliseconds, offset = 0;
  if (pattern == "0") pattern = "0:00";
  match = /^(-?)(\d+)(?::(\d+))?(?::(\d+))?$/.exec(pattern);
  if (!match) throw new Error("pattern: " + pattern);
  if (!seconds && match[4]) throw new Error("" + pattern + " " + match[3]);
  match[1] += '1';
  for (i = 1; i < 5; i++) match[i] = parseInt(match[i] || 0, 10);
  milliseconds = [ 36e5, 6e4, 1e3 ];
  for (i = 0; i < 3; i++) offset += match[i + 2] * milliseconds[i];
  return offset * match[1];
}

function getDate (month, day) {
  var date, last, least, match;
  if (match = /^last(.*)$/.exec(day)) {
    date = month, day = DAY.indexOf(match[1]);
    while (date.getUTCMonth() == month.getUTCMonth()) {
      if (date.getUTCDay() == day) last = date;
      date = new Date(date.getTime() + 864e5);
    }
    return last;
  } else if (match = /^first(.*)$/.exec(day)) {
    return getDate(year, month, match[1] + ">=1");
  } else if (match = /^(\w+)>=(\d+)$/.exec(day)) {
    date = month, day = DAY.indexOf(match[1]), least = parseInt(match[2], 10);
    while (date.getUTCDate() < least) date.setUTCDate(date.getUTCDate() + 1);
    while (date.getUTCDay() != day) date.setUTCDate(date.getUTCDate() + 1);
    return date;
  } else {
    month.setUTCDate(parseInt(day, 10));
    return month;
  }
};

function nameOfClock (time) {
  switch (time[time.length - 1]) {
    case "s":
      return "standard";
    case "g":
    case "u":
    case "z":
      return "posix";
    default:
      return "wallclock";
  }
}

var file = process.argv[2]
  , info = { rules: {}, zones: {}, links: {} }
  , base = file.replace(/^.*\/(.*)$/, "$1")
  , name = null
  , lines = fs.readFileSync(file, "utf8").split(/\n/)
  , k, K
  ;

for (k = 0, K = lines.length; k < K; k++) {
  line = lines[k].trim();
  if (line == "" || /^\s*#/.test(line)) continue;
  line = line.replace(/\s*#.*$/, "");
  record = line.split(/\s+/);
  switch (record[0]) {
    case "Rule":
      var rule = record.slice(1)
        , name = rule[0]
        , from = rule[1]
        , to = rule[2]
        , type = rule[3]
        , month = rule[4]
        , day = rule[5]
        , time = rule[6]
        , save = rule[7]
        , letter = rule[8]
        , clock = nameOfClock(time)
        ;

      if (type !== "-") throw Error("A type! What does it mean?");

      if (time == "0") time = "0:00";
      time = time.replace(/[suzgw]$/, '');
      time = /^(\d+):(\d+)(?::(\d+))?$/.exec(time);
      if (time[3]) throw new Error("A rule time with seconds.");
      time = parseInt(time[1], 10) * 60 + parseInt(time[2], 10);

      if (! info.rules[name]) info.rules[name] = [];

      info.rules[name].push({
        from: parseInt(from, 10),
        to: (function() {
          switch (to) {
            case "only": return parseInt(from, 10);
            case "max": return Number.MAX_VALUE;
            default: return parseInt(to, 10);
          }
        })(),
        month: MONTH.indexOf(month),
        day: day,
        time: time,
        clock: clock,
        save: parseOffset(save) / 6e4,
        letter: letter == "-" ? "" : letter
      });

      break;
    case "Link":
      info.links[record[2]] = record[1];
      break;
    default:
      if (record[0] == "Zone") {
        name = record[1];
        info.zones[name] = [];
        record = record.slice(2);
      }
      info.zones[name].push({
        offset: parseOffset(record[0], true) / 1000,
        rules: record[1],
        format: record[2],
        until: record.slice(3)
      });
  }
}

function iso8601 (date) { return new Date(date).toISOString().replace(/\..*$/, "") }

var zone, match, name;
for (name in info.zones) {
  zone = info.zones[name];
  zone.reverse();
  for (i = 0, I = zone.length; i < I; i++) {
    record = zone[i];
    record.clock = "wallclock";
    if (record.rules == "-") {
      record.rules = false;
    } else if (/^\d+:\d+$/.test(record.rules)) {
      record.rules = parseOffset(record.rules) / 6e4;
    }
    if (record.until.length) {
      date = new Date(Date.UTC(parseInt(record.until.shift(), 10), MONTH.indexOf(record.until.shift() || "Jan")));
      if (record.until.length) {
        date = getDate(date, record.until.shift());
        if (record.until.length) {
          time = record.until.shift();
          record.clock = nameOfClock(time);
          match = /^(\d+):(\d+)(?::(\d+))?[swguz]?$/.exec(time);
          date.setUTCHours(parseInt(match[1], 10));
          date.setUTCMinutes(parseInt(match[2], 10));
          date.setUTCSeconds(parseInt(match[3] || 0, 10));
        }
      }
      record.until = date.getTime() / 1000;
    } else {
      record.until = false;
    }
  }
  info.zones[name] = (function (zone) {
    var copy = [];
    for (var i = zone.length - 2; i >= 0; --i) {
      copy[i] = {
        rules: zone[i].rules,
        format: zone[i].format,
        offset: zone[i].offset * 1000,
        save: 0,
        clock: zone[i + 1].clock
      };
      copy[i][copy[i].clock] = zone[i + 1].until === false ? Number.MAX_VALUE : zone[i + 1].until * 1000;
    }

    copy.push({
      offset: zone[zone.length - 1].offset * 1000,
      format: zone[zone.length - 1].format,
      save: 0
    });

    copy.reverse();
    copy[0].posix = copy[0].wallclock = -Number.MAX_VALUE;
    copy.slice(1).forEach(function (e) { e.begins =  iso8601(e[e.clock]) + " " + e.clock });
    return copy;
  })(zone);
}

process.stdout.write("module.exports = ");
process.stdout.write(JSON.stringify(info, null, 2));
process.stdout.write("\n");
