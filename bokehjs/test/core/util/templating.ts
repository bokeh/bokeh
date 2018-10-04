import {expect} from "chai"

import * as tmpl from "core/util/templating"
import {keys} from "core/util/object"

import {ColumnDataSource} from "models/sources/column_data_source"
import {CustomJSHover} from "models/tools/inspectors/customjs_hover"

describe("templating module", () => {

  describe("DEFAULT_FORMATTERS", () => {

    it("should have 3 entries", () => {
      expect(keys(tmpl.DEFAULT_FORMATTERS).length).to.be.equal(3)
    })

    it("should have a numeral formatter", () => {
      const f = tmpl.DEFAULT_FORMATTERS["numeral"]
      expect(f(3.123, "$0.00", {})).to.be.equal("$3.12")
    })

    it("should have a datetime formatter", () => {
      const f = tmpl.DEFAULT_FORMATTERS["datetime"]
      expect(f(946684800000, "%m/%d/%Y", {})).to.be.equal("01/01/2000")
    })

    it("should have a printf formatter", () => {
      const f = tmpl.DEFAULT_FORMATTERS["printf"]
      expect(f(23.123456, "%5.3f mu", {})).to.be.equal("23.123 mu")
    })
  })

  describe("basic_formatter", () => {

    it("should return strings as-is", () => {
      const v = tmpl.basic_formatter("foo", "junk", {})
      expect(v).to.be.equal("foo")
    })

    it("should not format integers as integers", () => {
      const v = tmpl.basic_formatter(5, "junk", {})
      expect(v).to.be.equal("5")
    })

    it("should use %0.3f between 0.1 and 1000", () => {
      const v1 = tmpl.basic_formatter(0.11111, "junk", {})
      expect(v1).to.be.equal("0.111")
      const v2 = tmpl.basic_formatter(1.11111, "junk", {})
      expect(v2).to.be.equal("1.111")
      const v3 = tmpl.basic_formatter(100.11111, "junk", {})
      expect(v3).to.be.equal("100.111")
      const v4 = tmpl.basic_formatter(999.11111, "junk", {})
      expect(v4).to.be.equal("999.111")
    })

    it("should use %0.3e outside 0.1 and 1000", () => {
      const v1 = tmpl.basic_formatter(0.0911111, "junk", {})
      expect(v1).to.be.equal("9.111e-2")
      const v2 = tmpl.basic_formatter(1000.11111, "junk", {})
      expect(v2).to.be.equal("1.000e+3")
    })
  })

  describe("get_formatter", () => {

    it("should return basic_formatter for null format", () => {
      const f = tmpl.get_formatter("x", "@x")
      expect(f).to.be.equal(tmpl.basic_formatter)
    })

    it("should return numeral formatter for specs not in formatters dict", () => {
      const f = tmpl.get_formatter("x", "@x", "$0.00")
      expect(f).to.be.equal(tmpl.DEFAULT_FORMATTERS["numeral"])
    })

    it("should return formatter from formatters dict when raw_spec is in formatters", () => {
      const f1 = tmpl.get_formatter("x", "@x", "$0.00", {"@x": "numeral"})
      expect(f1).to.be.equal(tmpl.DEFAULT_FORMATTERS["numeral"])

      const f2 = tmpl.get_formatter("x", "@x", "%5.3f mu", {"@x": "printf"})
      expect(f2).to.be.equal(tmpl.DEFAULT_FORMATTERS["printf"])

      const f3 = tmpl.get_formatter("x", "@x", "%m/%d/%Y", {"@x": "datetime"})
      expect(f3).to.be.equal(tmpl.DEFAULT_FORMATTERS["datetime"])

      const custom = new CustomJSHover({code:"return format + ' ' + special_vars.special + ' ' + value"})
      const f4 = tmpl.get_formatter("x", "@x", "custom", {"@x": custom})
      expect(f4(3.123, "custom", {special: 10})).to.be.equal("custom 10 3.123")
    })

    // this should be removed ~Bokeh 2.0
    it("should return formatter from formatters dict when name is in formatters", () => {
      const f1 = tmpl.get_formatter("x", "@x", "$0.00", {x: "numeral"})
      expect(f1).to.be.equal(tmpl.DEFAULT_FORMATTERS["numeral"])

      const f2 = tmpl.get_formatter("x", "@x", "%5.3f mu", {x: "printf"})
      expect(f2).to.be.equal(tmpl.DEFAULT_FORMATTERS["printf"])

      const f3 = tmpl.get_formatter("x", "@x", "%m/%d/%Y", {x: "datetime"})
      expect(f3).to.be.equal(tmpl.DEFAULT_FORMATTERS["datetime"])

      const custom = new CustomJSHover({code:"return format + ' ' + special_vars.special + ' ' + value"})
      const f4 = tmpl.get_formatter("x", "@x", "custom", {x: custom})
      expect(f4(3.123, "custom", {special: 10})).to.be.equal("custom 10 3.123")
    })

    it("should throw an error on unknown formatter type", () => {
      expect(() => tmpl.get_formatter("x", "@x", "%5.3f mu", {x: "junk" as any})).to.throw(Error)
    })
  })

  describe("get_value", () => {

    const source = new ColumnDataSource({data: {foo: [10, 1.002], bar: ["a", "<div>b</div>"], baz: [1492890671885, 1290460671885]}})

    const imsource = new ColumnDataSource({data:
                                           {arrs: [[[0, 10, 20], [30, 40, 50]]],
                                            floats: [[0.,1.,2.,3.,4.,5.]],
                                            labels: ['test label']}})
    const imindex1 = {index: 0, dim1: 2, dim2: 1, flat_index: 5}
    const imindex2 = {index: 0, dim1: 1, dim2: 0, flat_index: 1}

    it("should return $ values from special_vars", () => {
      const v = tmpl.get_value("$x", source, 0, {x: 99999})
      expect(v).to.be.equal(99999)
    })

    it("should throw an error on unknown special vars", () => {
      expect(() => tmpl.get_value("$x", source, 0, {}).to.throw(Error))
    })

    it("should return null for missing column", () => {
      const v = tmpl.get_value("x", source, 0, {})
      expect(v).to.be.null
    })

    it("should return integer indices from columns", () => {
      const v1 = tmpl.get_value("foo", source, 0, {})
      expect(v1).to.be.equal(10)

      const v2 = tmpl.get_value("foo", source, 1, {})
      expect(v2).to.be.equal(1.002)
    })

    it("should index flat typed array format for images", () => {
      const v1 = tmpl.get_value("floats", imsource, imindex1, {})
      expect(v1).to.be.equal(5)

      const v2 = tmpl.get_value("floats", imsource, imindex2, {})
      expect(v2).to.be.equal(1)
    })

    it("should index array of arrays format for images", () => {
      const v1 = tmpl.get_value("arrs", imsource, imindex1, {})
      expect(v1).to.be.equal(50)

      const v2 = tmpl.get_value("arrs", imsource, imindex2, {})
      expect(v2).to.be.equal(10)
    })

    it("should index scalar data format for images", () => {
      const v1 = tmpl.get_value("labels", imsource, imindex1, {})
      expect(v1).to.be.equal('test label')

      const v2 = tmpl.get_value("labels", imsource, imindex2, {})
      expect(v2).to.be.equal('test label')
    })

  })

  describe("replace_placeholders", () => {

    const source = new ColumnDataSource({data: {foo: [10, 1.002], bar: ["a", "<div>b</div>"], baz: [1492890671885, 1290460671885]}})

    it("should replace unknown field names with ???", () => {
      const s = tmpl.replace_placeholders("stuff @junk", source, 0)
      expect(s).to.be.equal("stuff ???")
    })

    it("should replace field names with escaped values by default", () => {
      const s1 = tmpl.replace_placeholders("stuff @foo", source, 0)
      expect(s1).to.be.equal("stuff 10")

      const s2 = tmpl.replace_placeholders("stuff @foo", source, 1)
      expect(s2).to.be.equal("stuff 1.002")

      const s3 = tmpl.replace_placeholders("stuff @bar", source, 0)
      expect(s3).to.be.equal("stuff a")

      const s4 = tmpl.replace_placeholders("stuff @bar", source, 1)
      expect(s4).to.be.equal("stuff &lt;div&gt;b&lt;/div&gt;")
    })

    it("should replace field names with values as-is with safe format", () => {
      const s1 = tmpl.replace_placeholders("stuff @foo{safe}", source, 0)
      expect(s1).to.be.equal("stuff 10")

      const s2 = tmpl.replace_placeholders("stuff @foo{safe}", source, 1)
      expect(s2).to.be.equal("stuff 1.002")

      const s3 = tmpl.replace_placeholders("stuff @bar{safe}", source, 0)
      expect(s3).to.be.equal("stuff a")

      const s4 = tmpl.replace_placeholders("stuff @bar{safe}", source, 1)
      expect(s4).to.be.equal("stuff <div>b</div>")
    })

    it("should ignore extra/unused formatters", () => {
      const s1 = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {quux: "numeral"})
      expect(s1).to.be.equal("stuff 1000.000 %")

      const s2 = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {quux: "numeral"})
      expect(s2).to.be.equal("stuff 100.200 %")
    })

    it("should throw an error on unrecognized formatters", () => {
      const fn = () => tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {foo: "junk" as any})
      expect(fn).to.throw(Error)
    })

    it("should default to numeral formatter", () => {
      // just picking a random and uniquely numbro format to test with
      const s1 = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0)
      expect(s1).to.be.equal("stuff 1000.000 %")

      const s2 = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 1)
      expect(s2).to.be.equal("stuff 100.200 %")
    })

    it("should use the numeral formatter if specified", () => {
      // just picking a random and uniquely numbro format to test with
      const s1 = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {foo: "numeral"})
      expect(s1).to.be.equal("stuff 1000.000 %")

      const s2 = tmpl.replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {foo: "numeral"})
      expect(s2).to.be.equal("stuff 100.200 %")
    })

    it("should use a customjs hover formatter if specified", () => {
      const custom = new CustomJSHover({code:"return format + ' ' + special_vars.special + ' ' + value"})
      const s = tmpl.replace_placeholders("stuff @foo{custom}", source, 0, {foo: custom}, {special: "vars"})
      expect(s).to.be.equal("stuff custom vars 10")
    })

    it("should replace field names with tz formatted values with datetime formatter", () => {
      // just picking a random and uniquely tz format to test with
      const s1 = tmpl.replace_placeholders("stuff @baz{%F %T}", source, 0, {baz: "datetime"})
      expect(s1).to.be.equal("stuff 2017-04-22 19:51:11")

      const s2 = tmpl.replace_placeholders("stuff @baz{%F %T}", source, 1, {baz: "datetime"})
      expect(s2).to.be.equal("stuff 2010-11-22 21:17:51")
    })

    it("should replace field names with Sprintf formatted values with printf formatter", () => {
      // just picking a random and uniquely Sprintf formats to test with
      const s1 = tmpl.replace_placeholders("stuff @foo{%x}", source, 0, {foo: "printf"})
      expect(s1).to.be.equal("stuff a")

      const s2 = tmpl.replace_placeholders("stuff @foo{%0.4f}", source, 1, {foo: "printf"})
      expect(s2).to.be.equal("stuff 1.0020")
    })

    it("should replace special vars with supplied values", () => {
      const s = tmpl.replace_placeholders("stuff $foo", source, 0, {}, {foo: "special"})
      expect(s).to.be.equal("stuff special")
    })

    it("should replace combinations and duplicates", () => {
      const s = tmpl.replace_placeholders("stuff $foo @foo @foo @foo{(0.000 %)} @baz{%F %T}", source, 0, {baz: "datetime"}, {foo: "special"})
      expect(s).to.be.equal("stuff special 10 10 1000.000 % 2017-04-22 19:51:11")
    })

    it("should handle special @$name case by using special_vars.name as the column", () => {
      const s = tmpl.replace_placeholders("stuff @$name", source, 0, {}, {name: "foo"})
      expect(s).to.be.equal("stuff 10")
    })
  })
})
