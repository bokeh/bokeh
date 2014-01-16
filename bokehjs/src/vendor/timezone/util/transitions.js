(function () {
  var ABBREV = "Sun Mon Tue Wed Thu Fri Sat".split(/\s/);

  function actualize (entry, rule, year, saved) {
    time = rule.time * 6e4;
    var date = /^(?:(\d+)|last(\w+)|(\w+)>=(\d+))$/.exec(rule.day);
    var fields;
    if (date[1]) {
      fields = new Date(Date.UTC(year, rule.month, parseInt(date[1], 10)));
    } else if (date[2]) {
      for (var i = 0, stop = ABBREV.length; i < stop; i++)
        if (ABBREV[i] === date[2]) break;
      // Remember that month is zero for Date.UTC.
      var day = new Date(Date.UTC(year, (rule.month + 1) % 12, 1) - 1).getUTCDate();
      // Asia/Amman springs forward at 24:00. We calculate the day without the
      // hour, so the hour doesn't push the day into tomorrow. If you're tempted
      // to create the full date in the loop, Amman says no.
      while ((fields = new Date(Date.UTC(year, rule.month, day))).getUTCDay() != i) day--;
    } else {
      var min = parseInt(date[4], 10);
      for (var i = 0, stop = ABBREV.length; i < stop; i++)
        if (ABBREV[i] === date[3]) break;
      day = 1;
      for (;;) {
        fields = new Date(Date.UTC(year, rule.month, day));
        if (fields.getUTCDay() === i && fields.getUTCDate() >= min) break;
        day++;
      }
    }

    var save = rule.save * 6e4;

    var offset = entry.offset;

    var sortable = fields.getTime();

    var actualized =  {
      clock: rule.clock,
      entry: entry,
      sortable: sortable,
      rule:rule,
      year: year,
      save: save,
      offset: offset,
      type: "rule"
    };

    actualized[actualized.clock] = fields.getTime() + time;

    // We call this function both before and after the `saved` is caclulated.
    // After `saved` is calculated, we can calculate all clocks here.
    if (saved) {
      switch (actualized.clock) {
      case "standard":
        var copy = [];
        for (var key in rule) copy[key] = rule[key];
        copy.time = copy.time + (copy.saved / 6e4);
        copy.clock = "wallclock";
        return actualize(entry, copy, year, saved);
      case "posix":
        actualized.wallclock = actualized.posix + entry.offset + rule.saved;
      case "wallclock":
        actualized.posix = actualized.wallclock - entry.offset - rule.saved;
      }
      actualized.clocks =
      { posix: iso8601(actualized.posix)
      , wallclock: iso8601(actualized.wallclock)
      }
    }

    return actualized;
  }

  function setClocks (record, effective) {
    switch (record.clock) {
    case "posix":
      record.standard = record.posix + effective.offset;
      record.wallclock = record.posix + effective.offset + effective.save;
      break;
    case "wallclock":
      record.posix = record.wallclock - effective.offset - effective.save;
      record.standard = record.wallclock - effective.save;
      break;
    case "standard":
      record.posix = record.standard - effective.offset;
      record.wallclock = record.standard + effective.save;
      break;
    }
    return record;
  }

  function getYear (time) { return new Date(time).getUTCFullYear() }

  function pushRule (table, entry, actual, abbrevs, rule) {
    var save = actual.save
      , abbrev = abbrevs[save ? 1 : 0] || entry.format.replace(/%s/, function () { return actual.rule.letter });
    table.push({
      offset: entry.offset,
      abbrev: abbrev,
      clock: actual.clock,
      wallclock: actual.wallclock,
      posix: actual.posix,
      standard: actual.standard,
      save: actual.save,
      rules: actual.rules,
      format: actual.format,
      type: actual.type,
      rule: rule
    });
  }

  function walk (data, begin, end, table) {
    var match
      , actual
      , max;

    // Oink. Oink. We'll be pigs.

    var rule
      , abbrevs
      , year = getYear(new Date().getTime()) + 1
      , rules = data.rules[begin.rules]
      , actualized = [];

    if (abbrevs = /(\w+)\/(\w+)/.exec(begin.format)) abbrevs.shift();
    else abbrevs = []

    for (var i = 0, length = rules.length; i < length; i++) {
      rules[i].index = i;
      for (var j = rules[i].from, to = Math.min(rules[i].to, year); j <= to; j++) {
        actualized.push(actualize(begin, rules[i], j));
      }
    }

    actualized.sort(function (a, b) { return a.sortable - b.sortable });

    i = 0, length = actualized.length

    for (; i < length; i++) {
      if (begin[actualized[i].clock] <= actualized[i][actualized[i].clock]) break;
    }

    var previous = begin;

    if (i == length) {
      var rules = data.rules[begin.rules], offset;
      for (var j = 0; j < rules.length; j++) {
        if (!rules[j].save) {
          begin.abbrev = abbrevs[0] || begin.format.replace(/%s/, function () { return rules[j].letter });
          break;
        }
      }
      return begin;
    }

    if (begin[actualized[i].clock] == actualized[i][actualized[i].clock]) {
      var temp = table.pop();
      actualized[i].rules =  temp.rules;
      actualized[i].format =  temp.format;
      actualized[i].type = "entry";
      // table.pop(); // A rule on the seam overrides the seam.
      previous = table[table.length - 1];
    } else {
      if (i === 0) {
        var rules = data.rules[begin.rules], offset;
        for (var j = 0; j < rules.length; j++) {
          if (!rules[j].save) {
            begin.abbrev = abbrevs[0] || begin.format.replace(/%s/, function () { return rules[j].letter });
            break;
          }
        }
      } else {
        begin.save = actualized[i - 1].save;
        begin.abbrev = abbrevs[begin.save ? 1 : 0] || begin.format.replace(/%s/, function () { return actualized[i - 1].rule.letter });
      }
    }

    for (; i < length; i++) {
      setClocks(actualized[i], previous);
      if (actualized[i][end.clock] >= end[end.clock]) {
        break;
      }
      pushRule(table, begin, actualized[i], abbrevs, actualized[i].rule);
      previous = actualized[i];
    }
    return table[table.length - 1];
  }

  function iso8601 (date) { try { return new Date(date).toISOString().replace(/\..*$/, "") } catch (e) { return "-" } }

  function skipList (data, name, table) {
    var i, I, rules, rule, skip = [], year;
    for (i = 0, I = table.length; i < I; i++) {
      if (table[i].type == "rule") {
        skip[skip.length - 1].actualizations.push(table[i]);
        skip[skip.length - 1].indices[table[i].rule.index] = true;
        skip[skip.length - 1].savings[table[i].rule.save] = true;
        //if (false && getYear(table[i].posix) != getYear(table[i].wallclock)) {
         // say("Whoa boy: " + name + ", " + skip[skip.length - 1].rules,  getYear(table[i].posix), getYear(table[i].wallclock), table[i].clock);
        //}
        if (table[i].rule.saved == null) {
          table[i].rule.saved = table[i - 1].save;
        } else if (table[i].rule.saved != table[i - 1].save) {
          rules = data.rules[skip[skip.length - 1].rules];
          year = getYear(table[i].posix)
          var rule = rules[table[i].rule.index], copy = {};
          if (year > rule.from) {
            copy = {};
            for (var key in rule) copy[key] = rule[key];
            copy.to = year - 1;
            copy.split = true;
            rule.from = year;
            rules.push(copy);
          }
          if (year < rule.to) {
            copy = {};
            for (var key in rule) copy[key] = rule[key];
            copy.from = year + 1;
            copy.split = true;
            rule.to = year;
            rules.push(copy);
          }
          rules.sort(function (a, b) { return a.from - b.from });
          for (var j = 0, J = rules.length; j < J; j++) {
            rules[j].index = j;
            delete rules[j].saved
          }
          return null;
        }
      } else {
        table[i].actualizations = [];
        table[i].indices = {};
        table[i].savings = {};
        skip.push(table[i]);
      }
    }
    skip.forEach(function (e) { e.indices = Object.keys(e.indices).sort() });
    skip.forEach(function (e) { e.savings = Object.keys(e.savings).sort() });
    return skip;
  }

  function applicable (entry, rules, actualized, time, clock) {
    var last, i, I, year = getYear(time);
    for (var j = year + 1; j >= year - 1; --j) {
      for (i = 0, I = rules.length; i < I; i++) {
          if (rules[i].from <= j && j <= rules[i].to) {
            actualized.push(actualize(entry, rules[i], j, true));
          } else if (rules[i].to < j) {
            last = rules[i].to;
            break;
        }
      }
    }
    return last;
  }

  function find (data, skipList, time, clock) {
    var i, I, entry, year = getYear(time), found;
    for (i = 0, I = skipList.length; i < I; i++) {
      if (skipList[i][clock] <= time) break;
    }
    entry = skipList[i];
    if (typeof entry.rules == "string") {
      rules = data.rules[entry.rules].slice(0);
      rules.sort(function (a, b) { return b.to - a.to });
      var actualized = [];
      var to = applicable(entry, rules, actualized, time, clock);
      if (to != null) applicable(entry, rules, actualized, Date.UTC(to, 5, 1), "wallclock");
      if (actualized.length) {
        actualized.sort(function (a, b) { return a.sortable - b.sortable });
        for (var i = 0, I = actualized.length; i < I; i++) {
          if (false && isNaN(actualized[i][clock])) say(actualized[i]);
          if (time >= actualized[i][clock] && actualized[i][actualized[i].clock] > entry[actualized[i].clock]) found = actualized[i];
        }
      }
    }
    return found || entry;
  }

  function verify (data, skipList, sorted, name)  {
    var i, I, j, J, entry, found;
    sorted = sorted.slice(0);
    sorted.pop();
    skipList.reverse();
    for (var i = 1, I = sorted.length; i < I; i++) {
      var found = find (data, skipList, sorted[i].posix, "posix");
      if (sorted[i].posix != found.posix) {
        die("NOPE", name, iso8601(sorted[i].posix), found);
      }

      var found = find (data, skipList, sorted[i].posix - 1, "posix");
      if (sorted[i - 1].posix != found.posix) {
        die("NOPE", name, iso8601(sorted[i].posix), iso8601(sorted[i - 1].posix), found);
      }
      if (sorted[i - 1].offset != found.offset) {
        die("NOPE", name, iso8601(sorted[i].posix), iso8601(sorted[i - 1].posix), found);
      }
      if (sorted[i - 1].save != found.save) {
        die("NOPE", name, iso8601(sorted[i].posix), iso8601(sorted[i - 1].posix), found);
      }
      var found = find (data, skipList, sorted[i].wallclock, "wallclock");
      if (sorted[i].wallclock != found.wallclock) {
        die("NOPE 0", name, iso8601(sorted[i].wallclock), found);
      }
      var found = find (data, skipList, sorted[i].wallclock - 1, "wallclock");
      if (sorted[i - 1].wallclock != found.wallclock) {
        die("NOPE -1", name, iso8601(sorted[i].wallclock), iso8601(sorted[i - 1].wallclock), sorted[i - 1].save, iso8601(found.wallclock), found);
      }
    }
    return sorted;
  }

  module.exports = function (data, zoneName, recurse) {
    // We `concat` because someday, we'll read right out of the database and the
    // `concat` will be our defensive copy.
    var table = []
      , zone = data.zones[zoneName].concat({ offset: 0 })
      , entry = zone.shift()
      , previous, offset, save = 0, wallclock, posix, rules;

    table.push(entry);

    for (var i = 0, length = zone.length; i < length; i++) {
      previous = entry;
      entry = zone[i];

      previous.abbrev = previous.format;

      if (previous.rules) {
        if (typeof previous.rules == "number") {
          previous.save = previous.rules * 6e4;
        } else {
          previous = walk(data, previous, entry, table); // previous is last rule, not last zone.
        }
      } else {
        previous.save = 0;
      }

      setClocks(entry, previous);

      table.push(entry);
    }

    table.forEach(function (e) {
      e.clocks =
      { wallclock: iso8601(e.wallclock)
      , posix: iso8601(e.posix)
      , standard: iso8601(e.standard)
      }
    });


    var strip = table.map(function (e) {
      var copy = {};
      "posix wallclock abbrev save offset".split(/\s/).forEach(function (key) { copy[key] = e[key] });
      return copy;
    });

    var skippy = skipList(data, zoneName, table.slice(0, table.length - 1));
    if (skippy == null) return module.exports(data, zoneName, true);

    verify(data, skippy, table, zoneName);

    var zones = {};

    return { table: table.reverse(), skipList: skippy };
  }
})();

var __slice = [].slice;
function die () {
  console.log.apply(console, __slice.call(arguments, 0));
  return process.exit(1);
};

function say () { return console.log.apply(console, __slice.call(arguments, 0)) }
