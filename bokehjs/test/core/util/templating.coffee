{expect} = require "chai"
utils = require "../../utils"

{replace_placeholders} = utils.require "core/util/templating"

{ColumnDataSource} = utils.require("models/sources/column_data_source")

describe "templating module", ->

  describe "replace_placeholders", ->

    source = new ColumnDataSource({data: {foo: [10, 1.002], bar: ["a", "<div>b</div>"], baz: [1492890671885, 1290460671885]}})

    it "should replace unknown field names with ???", ->
      s = replace_placeholders("stuff @junk", source, 0)
      expect(s).to.be.equal "stuff ???"

    it "should replace field names with escaped values by default", ->
      s = replace_placeholders("stuff @foo", source, 0)
      expect(s).to.be.equal "stuff 10"

      s = replace_placeholders("stuff @foo", source, 1)
      expect(s).to.be.equal "stuff 1.002"

      s = replace_placeholders("stuff @bar", source, 0)
      expect(s).to.be.equal "stuff a"

      s = replace_placeholders("stuff @bar", source, 1)
      expect(s).to.be.equal "stuff &lt;div&gt;b&lt;/div&gt;"

    it "should replace field names with values as-is with safe format", ->
      s = replace_placeholders("stuff @foo{safe}", source, 0)
      expect(s).to.be.equal "stuff 10"

      s = replace_placeholders("stuff @foo{safe}", source, 1)
      expect(s).to.be.equal "stuff 1.002"

      s = replace_placeholders("stuff @bar{safe}", source, 0)
      expect(s).to.be.equal "stuff a"

      s = replace_placeholders("stuff @bar{safe}", source, 1)
      expect(s).to.be.equal "stuff <div>b</div>"

    it "should ignore extra/unused formatters", ->
      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"quux": "numeral"})
      expect(s).to.be.equal "stuff 1000.000 %"

      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {"quux": "numeral"})
      expect(s).to.be.equal "stuff 100.200 %"

    it "should throw an error on unrecognized formatters", ->
      fn = () -> replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"foo": "junk"})
      expect(fn).to.throw Error

    it "should default to numeral formatter", ->
      # just picking a random and uniquely numbro format to test with
      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 0)
      expect(s).to.be.equal "stuff 1000.000 %"

      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 1)
      expect(s).to.be.equal "stuff 100.200 %"

    it "should use the numeral formatter if specified", ->
      # just picking a random and uniquely numbro format to test with
      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"foo": "numeral"})
      expect(s).to.be.equal "stuff 1000.000 %"

      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {"foo": "numeral"})
      expect(s).to.be.equal "stuff 100.200 %"

    it "should replace field names with tz formatted values with datetime formatter", ->
      # just picking a random and uniquely tz format to test with
      s = replace_placeholders("stuff @baz{%F %T}", source, 0, {"baz": "datetime"})
      expect(s).to.be.equal "stuff 2017-04-22 19:51:11"

      s = replace_placeholders("stuff @baz{%F %T}", source, 1, {"baz": "datetime"})
      expect(s).to.be.equal "stuff 2010-11-22 21:17:51"

    it "should replace field names with Sprintf formatted values with printf formatter", ->
      # just picking a random and uniquely Sprintf formats to test with
      s = replace_placeholders("stuff @foo{%x}", source, 0, {"foo": "printf"})
      expect(s).to.be.equal "stuff a"

      s = replace_placeholders("stuff @foo{%0.4f}", source, 1, {"foo": "printf"})
      expect(s).to.be.equal "stuff 1.0020"

    it "should replace special vars with supplied values", ->
      s = replace_placeholders("stuff $foo", source, 0, {}, {"foo": "special"})
      expect(s).to.be.equal "stuff special"

    it "should replace combinations and duplicates", ->
      s = replace_placeholders("stuff $foo @foo @foo @foo{(0.000 %)} @baz{%F %T}", source, 0, {"baz": "datetime"}, {"foo": "special"})
      expect(s).to.be.equal "stuff special 10 10 1000.000 % 2017-04-22 19:51:11"
