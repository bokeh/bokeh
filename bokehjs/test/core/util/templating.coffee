{expect} = require "chai"
utils = require "../../utils"

tmpl = utils.require "core/util/templating"

{keys} = utils.require("core/util/object")

{ColumnDataSource} = utils.require("models/sources/column_data_source")
{CustomJSHover} = utils.require("models/tools/inspectors/customjs_hover")

describe "templating module", ->

  describe "DEFAULT_FORMATTERS", ->

    it "should have 3 entries", ->
      expect(keys(tmpl.DEFAULT_FORMATTERS).length).to.be.equal 3

    it "should have a numeral formatter", ->
      f = tmpl.DEFAULT_FORMATTERS["numeral"]
      expect(f(3.123, "$0.00", {})).to.be.equal "$3.12"

    it "should have a datetime formatter", ->
      f = tmpl.DEFAULT_FORMATTERS["datetime"]
      expect(f(946684800000, "%m/%d/%Y", {})).to.be.equal "01/01/2000"

    it "should have a printf formatter", ->
      f = tmpl.DEFAULT_FORMATTERS["printf"]
      expect(f(23.123456, "%5.3f mu", {})).to.be.equal "23.123 mu"

  describe "basic_formatter", ->

    it "should return strings as-is", ->
      v = tmpl.basic_formatter("foo", "junk", {})
      expect(v).to.be.equal "foo"

    it "should not format integers as integers", ->
      v = tmpl.basic_formatter(5, "junk", {})
      expect(v).to.be.equal "5"

    it "should use %0.3f between 0.1 and 1000", ->
      v = tmpl.basic_formatter(0.11111, "junk", {})
      expect(v).to.be.equal "0.111"
      v = tmpl.basic_formatter(1.11111, "junk", {})
      expect(v).to.be.equal "1.111"
      v = tmpl.basic_formatter(100.11111, "junk", {})
      expect(v).to.be.equal "100.111"
      v = tmpl.basic_formatter(999.11111, "junk", {})
      expect(v).to.be.equal "999.111"

    it "should use %0.3e outside 0.1 and 1000", ->
      v = tmpl.basic_formatter(0.0911111, "junk", {})
      expect(v).to.be.equal "9.111e-2"
      v = tmpl.basic_formatter(1000.11111, "junk", {})
      expect(v).to.be.equal "1.000e+3"

  describe "get_formatter", ->

    it "should return basic_formatter for null format", ->
      f = tmpl.get_formatter("x", "@x", null, {})
      expect(f).to.be.equal tmpl.basic_formatter

    it "should return numeral formatter for specs not in formatters dict", ->
      f = tmpl.get_formatter("x", "@x", "$0.00", {})
      expect(f).to.be.equal tmpl.DEFAULT_FORMATTERS["numeral"]

    it "should return formatter from formatters dict when raw_spec is in formatters", ->
      f = tmpl.get_formatter("x", "@x", "$0.00", {"@x": "numeral"})
      expect(f).to.be.equal tmpl.DEFAULT_FORMATTERS["numeral"]

      f = tmpl.get_formatter("x", "@x", "%5.3f mu", {"@x": "printf"})
      expect(f).to.be.equal tmpl.DEFAULT_FORMATTERS["printf"]

      f = tmpl.get_formatter("x", "@x", "%m/%d/%Y", {"@x": "datetime"})
      expect(f).to.be.equal tmpl.DEFAULT_FORMATTERS["datetime"]

      custom = new CustomJSHover({code:"return format + ' ' + special_vars.special + ' ' + value"})
      f = tmpl.get_formatter("x", "@x", "custom", {"@x": custom})
      expect(f(3.123, "custom", {special: 10})).to.be.equal "custom 10 3.123"

    # this should be removed ~Bokeh 2.0
    it "should return formatter from formatters dict when name is in formatters", ->
      f = tmpl.get_formatter("x", "@x", "$0.00", {"x": "numeral"})
      expect(f).to.be.equal tmpl.DEFAULT_FORMATTERS["numeral"]

      f = tmpl.get_formatter("x", "@x", "%5.3f mu", {"x": "printf"})
      expect(f).to.be.equal tmpl.DEFAULT_FORMATTERS["printf"]

      f = tmpl.get_formatter("x", "@x", "%m/%d/%Y", {"x": "datetime"})
      expect(f).to.be.equal tmpl.DEFAULT_FORMATTERS["datetime"]

      custom = new CustomJSHover({code:"return format + ' ' + special_vars.special + ' ' + value"})
      f = tmpl.get_formatter("x", "@x", "custom", {"x": custom})
      expect(f(3.123, "custom", {special: 10})).to.be.equal "custom 10 3.123"

    it "should throw an error on unknown formatter type", ->
      expect(() -> tmpl.get_formatter("x", "@x", "%5.3f mu", {"x": "junk"})).to.throw Error

  describe "get_value", ->

    source = new ColumnDataSource({data: {foo: [10, 1.002], bar: ["a", "<div>b</div>"], baz: [1492890671885, 1290460671885]}})

    it "should return $ values from special_vars", ->
      v = tmpl.get_value("$x", source, 0, {"x": 99999})
      expect(v).to.be.equal 99999

    it "should throw an error on unknown special vars", ->
      expect(() -> tmpl.get_value("$x", source, 0, {}).to.throw Error)

    it "should return null for missing column", ->
      v = tmpl.get_value("x", source, 0, {})
      expect(v).to.be.null

    it "should return integer indices from columns", ->
      v = tmpl.get_value("foo", source, 0, {})
      expect(v).to.be.equal 10

      v = tmpl.get_value("foo", source, 1, {})
      expect(v).to.be.equal 1.002

  describe "replace_placeholders", ->

    source = new ColumnDataSource({data: {foo: [10, 1.002], bar: ["a", "<div>b</div>"], baz: [1492890671885, 1290460671885]}})

    it "should replace unknown field names with ???", ->
      s = tmpl.replace_placeholders("stuff @junk", source, 0)
      expect(s).to.be.equal "stuff ???"

    it "should replace field names with escaped values by default", ->
      s = tmpl.replace_placeholders("stuff @foo", source, 0)
      expect(s).to.be.equal "stuff 10"

      s = tmpl.replace_placeholders("stuff @foo", source, 1)
      expect(s).to.be.equal "stuff 1.002"

      s = tmpl.replace_placeholders("stuff @bar", source, 0)
      expect(s).to.be.equal "stuff a"

      s = tmpl.replace_placeholders("stuff @bar", source, 1)
      expect(s).to.be.equal "stuff &lt;div&gt;b&lt;/div&gt;"

    it "should replace field names with values as-is with safe format", ->
      s = tmpl.replace_placeholders("stuff @foo{safe}", source, 0)
      expect(s).to.be.equal "stuff 10"

      s = tmpl.replace_placeholders("stuff @foo{safe}", source, 1)
      expect(s).to.be.equal "stuff 1.002"

      s = tmpl.replace_placeholders("stuff @bar{safe}", source, 0)
      expect(s).to.be.equal "stuff a"

      s = tmpl.replace_placeholders("stuff @bar{safe}", source, 1)
      expect(s).to.be.equal "stuff <div>b</div>"

    it "should ignore extra/unused formatters", ->
      s = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"quux": "numeral"})
      expect(s).to.be.equal "stuff 1000.000 %"

      s = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {"quux": "numeral"})
      expect(s).to.be.equal "stuff 100.200 %"

    it "should throw an error on unrecognized formatters", ->
      fn = () -> tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"foo": "junk"})
      expect(fn).to.throw Error

    it "should default to numeral formatter", ->
      # just picking a random and uniquely numbro format to test with
      s = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0)
      expect(s).to.be.equal "stuff 1000.000 %"

      s = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 1)
      expect(s).to.be.equal "stuff 100.200 %"

    it "should use the numeral formatter if specified", ->
      # just picking a random and uniquely numbro format to test with
      s = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"foo": "numeral"})
      expect(s).to.be.equal "stuff 1000.000 %"

      s = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {"foo": "numeral"})
      expect(s).to.be.equal "stuff 100.200 %"

    it "should use a customjs hover formatter if specified", ->
      custom = new CustomJSHover({code:"return format + ' ' + special_vars.special + ' ' + value"})
      s = tmpl.replace_placeholders("stuff @foo{custom}", source, 0, {"foo": custom}, {special: "vars"})
      expect(s).to.be.equal "stuff custom vars 10"

    it "should replace field names with tz formatted values with datetime formatter", ->
      # just picking a random and uniquely tz format to test with
      s = tmpl.replace_placeholders("stuff @baz{%F %T}", source, 0, {"baz": "datetime"})
      expect(s).to.be.equal "stuff 2017-04-22 19:51:11"

      s = tmpl.replace_placeholders("stuff @baz{%F %T}", source, 1, {"baz": "datetime"})
      expect(s).to.be.equal "stuff 2010-11-22 21:17:51"

    it "should replace field names with Sprintf formatted values with printf formatter", ->
      # just picking a random and uniquely Sprintf formats to test with
      s = tmpl.replace_placeholders("stuff @foo{%x}", source, 0, {"foo": "printf"})
      expect(s).to.be.equal "stuff a"

      s = tmpl.replace_placeholders("stuff @foo{%0.4f}", source, 1, {"foo": "printf"})
      expect(s).to.be.equal "stuff 1.0020"

    it "should replace special vars with supplied values", ->
      s = tmpl.replace_placeholders("stuff $foo", source, 0, {}, {"foo": "special"})
      expect(s).to.be.equal "stuff special"

    it "should replace combinations and duplicates", ->
      s = tmpl.replace_placeholders("stuff $foo @foo @foo @foo{(0.000 %)} @baz{%F %T}", source, 0, {"baz": "datetime"}, {"foo": "special"})
      expect(s).to.be.equal "stuff special 10 10 1000.000 % 2017-04-22 19:51:11"
