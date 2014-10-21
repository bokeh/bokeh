!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function") define(definition);
  else this.tz = definition();
} (function () {
/*
  function die () {
    console.log.apply(console, __slice.call(arguments, 0));
    return process.exit(1);
  }

  function say () { return console.log.apply(console, __slice.call(arguments, 0)) }
*/
  function actualize (entry, rule, year) {
    var actualized, date = rule.day[1];

    do {
      actualized = new Date(Date.UTC(year, rule.month, Math.abs(date++)));
    } while (rule.day[0] < 7 && actualized.getUTCDay() != rule.day[0])

    actualized = {
      clock: rule.clock,
      sort: actualized.getTime(),
      rule: rule,
      save: rule.save * 6e4,
      offset: entry.offset
    };

    actualized[actualized.clock] = actualized.sort + rule.time * 6e4;

    if (actualized.posix) {
      actualized.wallclock = actualized[actualized.clock] + (entry.offset + rule.saved);
    } else {
      actualized.posix = actualized[actualized.clock] - (entry.offset + rule.saved);
    }

    return actualized;
  }

  function find (request, clock, time) {
    var i, I, entry, found, zone = request[request.zone], actualized = [], abbrev, rules
      , j, year = new Date(time).getUTCFullYear(), off = 1;
    for (i = 1, I = zone.length; i < I; i++) if (zone[i][clock] <= time) break;
    entry = zone[i];
    if (entry.rules) {
      rules = request[entry.rules];
      for (j = year + 1; j >= year - off; --j)
        for (i = 0, I = rules.length; i < I; i++)
          if (rules[i].from <= j && j <= rules[i].to) actualized.push(actualize(entry, rules[i], j));
          else if (rules[i].to < j && off == 1) off = j - rules[i].to;
      actualized.sort(function (a, b) { return a.sort - b.sort });
      for (i = 0, I = actualized.length; i < I; i++) {
        if (time >= actualized[i][clock] && actualized[i][actualized[i].clock] > entry[actualized[i].clock]) found = actualized[i];
      }
    }
    if (found) {
      if (abbrev = /^(.*)\/(.*)$/.exec(entry.format)) {
        found.abbrev = abbrev[found.save ? 2 : 1];
      } else {
        found.abbrev = entry.format.replace(/%s/, found.rule.letter);
      }
    }
    return found || entry;
  }

  function convertToWallclock (request, posix) {
    if (request.zone == "UTC") return posix;
    request.entry = find(request, "posix", posix);
    return posix + request.entry.offset + request.entry.save;
  }

  function convertToPOSIX (request, wallclock) {
    if (request.zone == "UTC") return wallclock;

    var entry, diff;
    request.entry = entry = find(request, "wallclock", wallclock);
    diff = wallclock - entry.wallclock;

    return 0 < diff && diff < entry.save ? null : wallclock - entry.offset - entry.save;
  }

  function adjust (request, posix, match) {
    var increment = +(match[1] + 1) // conversion necessary for week day addition
      , offset = match[2] * increment
      , index = UNITS.indexOf(match[3].toLowerCase())
      , date
      ;
    if (index > 9) {
      posix += offset * TIME[index - 10];
    } else {
      date = new Date(convertToWallclock(request, posix));
      if (index < 7) {
        while (offset) {
          date.setUTCDate(date.getUTCDate() + increment);
          if (date.getUTCDay() == index) offset -= increment;
        }
      } else if (index == 7) {
        date.setUTCFullYear(date.getUTCFullYear() + offset);
      } else if (index == 8) {
        date.setUTCMonth(date.getUTCMonth() + offset);
      } else {
        date.setUTCDate(date.getUTCDate() + offset);
      }
      if ((posix = convertToPOSIX(request, date.getTime())) == null) {
        posix = convertToPOSIX(request, date.getTime() + 864e5 * increment) - 864e5 * increment;
      }
    }
    return posix;
  }

  function convert (vargs) {
    if (!vargs.length) return "0.0.23";

    var request = Object.create(this)
      , adjustments = []
      , i, I, $, argument, date
      ;

    for (i = 0; i < vargs.length; i++) { // leave the for loop alone, it works.
      argument = vargs[i];
      // https://twitter.com/bigeasy/status/215112186572439552
      if (Array.isArray(argument)) {
        if (!i && !isNaN(argument[1])) {
          date = argument;
        } else {
          argument.splice.apply(vargs, [ i--, 1 ].concat(argument));
        }
      } else if (isNaN(argument)) {
        $ = typeof argument;
        if ($ == "string") {
          if (~argument.indexOf("%")) {
            request.format = argument;
          } else if (!i && argument == "*") {
            date = argument;
          } else if (!i && ($ = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|(([+-])(\d{2}(:\d{2}){0,2})))?)?$/.exec(argument))) {
            date = [];
            date.push.apply(date, $.slice(1, 8));
            if ($[9]) {
              date.push($[10] + 1);
              date.push.apply(date, $[11].split(/:/));
            } else if ($[8]) {
              date.push(1);
            }
          } else if (/^\w{2,3}_\w{2}$/.test(argument)) {
            request.locale = argument;
          } else if ($ = UNIT_RE.exec(argument)) {
            adjustments.push($);
          } else {
            request.zone = argument;
          }
        } else if ($ == "function") {
          if ($ = argument.call(request)) return $;
        } else if (/^\w{2,3}_\w{2}$/.test(argument.name)) {
          request[argument.name] = argument;
        } else if (argument.zones) {
          for ($ in argument.zones) request[$] = argument.zones[$];
          for ($ in argument.rules) request[$] = argument.rules[$];
        }
      } else if (!i) {
        date = argument;
      }
    }

    if (!request[request.locale]) delete request.locale;
    if (!request[request.zone]) delete request.zone;

    if (date != null) {
      if (date == "*") {
        date = request.clock();
      } else if (Array.isArray(date)) {
        I = !date[7];
        for (i = 0; i < 11; i++) date[i] = +(date[i] || 0); // conversion necessary for decrement
        --date[1]; // Grr..
        date = Date.UTC.apply(Date.UTC, date.slice(0, 8)) +
          -date[7] * (date[8] * 36e5 + date[9] * 6e4 + date[10] * 1e3);
      } else {
        date = Math.floor(date);
      }
      if (!isNaN(date)) {
        if (I) date = convertToPOSIX(request, date);

        if (date == null) return date;

        for (i = 0, I = adjustments.length; i < I; i++) {
          date = adjust(request, date, adjustments[i]);
        }

        if (!request.format) return date;

        $ = new Date(convertToWallclock(request, date));
        return request.format.replace(/%([-0_^]?)(:{0,3})(\d*)(.)/g,
        function (value, flag, colons, padding, specifier) {
          var f, fill = "0", pad;
          if (f = request[specifier]) {
            value = String(f.call(request, $, date, flag, colons.length));
            if ((flag || f.style) == "_") fill = " ";
            pad = flag == "-" ? 0 : f.pad || 0;
            while (value.length < pad) value = fill + value;
            pad = flag == "-" ? 0 : padding || f.pad;
            while (value.length < pad) value = fill + value;
            if (specifier == "N" && pad < value.length) value = value.slice(0, pad);
            if (flag == "^") value = value.toUpperCase();
          }
          return value;
        });
      }
    }

    return function () { return request.convert(arguments) };
  }

  var context =
    { clock: function () { return +(new Date()) }
    , zone: "UTC"
    , entry: { abbrev: "UTC", offset: 0, save: 0 }
    , UTC: 1
    , z: function(date, posix, flag, delimiters) {
        var offset = this.entry.offset + this.entry.save
          , seconds = Math.abs(offset / 1000), parts = [], part = 3600, i, z;
        for (i = 0; i < 3; i++) {
          parts.push(("0" + Math.floor(seconds / part)).slice(-2));
          seconds %= part;
          part /= 60;
        }
        if (flag == "^" && !offset) return "Z";
        if (flag == "^") delimiters = 3;
        if (delimiters == 3) {
          z = parts.join(":");
          z = z.replace(/:00$/, "");
          if (flag != "^") z = z.replace(/:00$/, "");
        } else if (delimiters) {
          z = parts.slice(0, delimiters + 1).join(":");
          if (flag == "^") z = z.replace(/:00$/, "");
        } else {
          z = parts.slice(0, 2).join("");
        }
        z = (offset < 0 ? "-" : "+") + z;
        z = z.replace(/([-+])(0)/, { "_": " $1", "-": "$1" }[flag] || "$1$2");
        return z;
      }
    , "%": function(date) { return "%" }
    , n: function (date) { return "\n" }
    , t: function (date) { return "\t" }
    , U: function (date) { return weekOfYear(date, 0) }
    , W: function (date) { return weekOfYear(date, 1) }
    , V: function (date) { return isoWeek(date)[0] }
    , G: function (date) { return isoWeek(date)[1] }
    , g: function (date) { return isoWeek(date)[1] % 100 }
    , j: function (date) { return Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0)) / 864e5) + 1 }
    , s: function (date) { return Math.floor(date.getTime() / 1000) }
    , C: function (date) { return Math.floor(date.getUTCFullYear() / 100) }
    , N: function (date) { return date.getTime() % 1000 * 1000000 }
    , m: function (date) { return date.getUTCMonth() + 1 }
    , Y: function (date) { return date.getUTCFullYear() }
    , y: function (date) { return date.getUTCFullYear() % 100 }
    , H: function (date) { return date.getUTCHours() }
    , M: function (date) { return date.getUTCMinutes() }
    , S: function (date) { return date.getUTCSeconds() }
    , e: function (date) { return date.getUTCDate() }
    , d: function (date) { return date.getUTCDate() }
    , u: function (date) { return date.getUTCDay() || 7 }
    , w: function (date) { return date.getUTCDay() }
    , l: function (date) { return date.getUTCHours() % 12 || 12 }
    , I: function (date) { return date.getUTCHours() % 12 || 12 }
    , k: function (date) { return date.getUTCHours() }
    , Z: function (date) { return this.entry.abbrev }
    , a: function (date) { return this[this.locale].day.abbrev[date.getUTCDay()] }
    , A: function (date) { return this[this.locale].day.full[date.getUTCDay()] }
    , h: function (date) { return this[this.locale].month.abbrev[date.getUTCMonth()] }
    , b: function (date) { return this[this.locale].month.abbrev[date.getUTCMonth()] }
    , B: function (date) { return this[this.locale].month.full[date.getUTCMonth()] }
    , P: function (date) { return this[this.locale].meridiem[Math.floor(date.getUTCHours() / 12)].toLowerCase() }
    , p: function (date) { return this[this.locale].meridiem[Math.floor(date.getUTCHours() / 12)] }
    , R: function (date, posix) { return this.convert([ posix, "%H:%M" ]) }
    , T: function (date, posix) { return this.convert([ posix, "%H:%M:%S" ]) }
    , D: function (date, posix) { return this.convert([ posix, "%m/%d/%y" ]) }
    , F: function (date, posix) { return this.convert([ posix, "%Y-%m-%d" ]) }
    , x: function (date, posix) { return this.convert([ posix, this[this.locale].date ]) }
    , r: function (date, posix) { return this.convert([ posix, this[this.locale].time12 || '%I:%M:%S' ]) }
    , X: function (date, posix) { return this.convert([ posix, this[this.locale].time24 ]) }
    , c: function (date, posix) { return this.convert([ posix, this[this.locale].dateTime ]) }
    , convert: convert
    , locale: "en_US"
    , en_US: {
        date: "%m/%d/%Y",
        time24: "%I:%M:%S %p",
        time12: "%I:%M:%S %p",
        dateTime: "%a %d %b %Y %I:%M:%S %p %Z",
        meridiem: [ "AM", "PM" ],
        month: {
          abbrev: "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec".split("|"),
          full: "January|February|March|April|May|June|July|August|September|October|November|December".split("|")
        },
        day: {
          abbrev: "Sun|Mon|Tue|Wed|Thu|Fri|Sat".split("|"),
          full: "Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday".split("|")
        }
      }
    };
  var UNITS = "Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|year|month|day|hour|minute|second|millisecond"
    , UNIT_RE = new RegExp("^\\s*([+-])(\\d+)\\s+(" + UNITS + ")s?\\s*$", "i")
    , TIME = [ 36e5, 6e4, 1e3, 1 ]
    ;
  UNITS = UNITS.toLowerCase().split("|");

  "delmHMSUWVgCIky".replace(/./g, function (e) { context[e].pad = 2 });

  context.N.pad = 9;
  context.j.pad = 3;

  context.k.style = "_";
  context.l.style = "_";
  context.e.style = "_";

  function weekOfYear (date, startOfWeek) {
    var diff, nyd, weekStart;
    nyd = new Date(Date.UTC(date.getUTCFullYear(), 0));
    diff = Math.floor((date.getTime() - nyd.getTime()) / 864e5);
    if (nyd.getUTCDay() == startOfWeek) {
      weekStart = 0;
    } else {
      weekStart = 7 - nyd.getUTCDay() + startOfWeek;
      if (weekStart == 8) {
        weekStart = 1;
      }
    }
    return diff >= weekStart ? Math.floor((diff - weekStart) / 7) + 1 : 0;
  }

  function isoWeek (date) {
    var nyd, nyy, week;
    nyy = date.getUTCFullYear();
    nyd = new Date(Date.UTC(nyy, 0)).getUTCDay();
    week = weekOfYear(date, 1) + (nyd > 1 && nyd <= 4 ? 1 : 0);
    if (!week) {
      nyy = date.getUTCFullYear() - 1;
      nyd = new Date(Date.UTC(nyy, 0)).getUTCDay();
      week = nyd == 4 || (nyd == 3 && new Date(nyy, 1, 29).getDate() == 29) ? 53 : 52;
      return [week, date.getUTCFullYear() - 1];
    } else if (week == 53 && !(nyd == 4 || (nyd == 3 && new Date(nyy, 1, 29).getDate() == 29))) {
      return [1, date.getUTCFullYear() + 1];
    } else {
      return [week, date.getUTCFullYear()];
    }
  }

  return function () { return context.convert(arguments) };
});
