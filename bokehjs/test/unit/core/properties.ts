import {expect} from "assertions"

import * as p from "@bokehjs/core/properties"
import * as enums from "@bokehjs/core/enums"

import {HasProps} from  "@bokehjs/core/has_props"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {svg_colors} from  "@bokehjs/core/util/svg_colors"
import {Transform} from  "@bokehjs/models/transforms/transform"
import {Expression} from  "@bokehjs/models/expressions/expression"

class TestTransform extends Transform {
  compute(x: number): number {
    return x+1
  }
  v_compute(xs: number[]): number[] {
    const ret =  []
    for (let i = 0; i < xs.length; i++)
      ret.push(xs[i] + i)
    return ret
  }
}

class TestExpression extends Expression {
  _v_compute(source: ColumnDataSource): number[] {
    const ret = []
    for (let i = 0; i < source.get_length()!; i++) {
      ret.push(i)
    }
    return ret
  }
}

namespace Some {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HasProps.Props & {
    anchor: p.Property<enums.Anchor>
    any: p.Property<any>
    array: p.Property<number[]>
    boolean: p.Property<boolean>
    color: p.Property<string>
    instance: p.Property<HasProps>
    number: p.Property<number>
    int: p.Property<number>
    angle: p.Property<number>
    percent: p.Property<number>
    string: p.Property<string>
    font_size: p.Property<string>
    font: p.Property<string>
    direction: p.Property<enums.Direction>
    angle_spec: p.AngleSpec
    boolean_spec: p.BooleanSpec
    color_spec: p.ColorSpec
    coordinate_spec: p.CoordinateSpec
    coordinate_seq_spec: p.CoordinateSeqSpec
    distance_spec: p.DistanceSpec
    font_size_spec: p.FontSizeSpec
    marker_spec: p.MarkerSpec
    number_spec: p.NumberSpec
    string_spec: p.StringSpec
    null_string_spec: p.NullStringSpec
  }
}

interface Some extends Some.Attrs {}

class Some extends HasProps {
  properties: Some.Props

  constructor(attrs?: Partial<Some.Attrs>) {
    super(attrs)
  }

  static init_Some(): void {
    this.define<Some.Props>({
      anchor: [ p.Anchor ],
      any: [ p.Any ],
      array: [ p.Array ],
      boolean: [ p.Boolean ],
      color: [ p.Color ],
      instance: [ p.Instance ],
      number: [ p.Number ],
      int: [ p.Int ],
      angle: [ p.Angle ],
      percent: [ p.Percent ],
      string: [ p.String ],
      font_size: [ p.FontSize ],
      font: [ p.Font ],
      direction: [ p.Direction ],
      angle_spec: [ p.AngleSpec ],
      boolean_spec: [ p.BooleanSpec ],
      color_spec: [ p.ColorSpec ],
      coordinate_spec: [ p.XCoordinateSpec ],
      coordinate_seq_spec: [ p.XCoordinateSeqSpec ],
      distance_spec: [ p.DistanceSpec ],
      font_size_spec: [ p.FontSizeSpec ],
      marker_spec: [ p.MarkerSpec ],
      number_spec: [ p.NumberSpec ],
      string_spec: [ p.StringSpec ],
      null_string_spec: [ p.NullStringSpec ],
    })
  }
}

describe("properties module", () => {

  function enum_validation_errors(prop: p.Property<unknown>): void {
    expect(prop.valid(true)).to.be.false
    expect(prop.valid(10)).to.be.false
    expect(prop.valid(10.2)).to.be.false
    expect(prop.valid("foo")).to.be.false
    expect(prop.valid({})).to.be.false
    expect(prop.valid([])).to.be.false
    expect(prop.valid(null)).to.be.false
    expect(prop.valid(undefined)).to.be.false
    expect(prop.valid(new Some())).to.be.false
  }

  describe("isSpec", () => {

    it("should identify field specs", () => {
      expect(p.isSpec({field: "foo"})).to.be.true
      expect(p.isSpec({field: "field"})).to.be.true // check corner case
    })

    it("should identify value specs", () => {
      expect(p.isSpec({value: "foo"})).to.be.true
    })

    it("should identify expr specs", () => {
      expect(p.isSpec({expr: "foo"})).to.be.true
    })

    it("should reject non-specs", () => {
      expect(p.isSpec(1)).to.be.false
      expect(p.isSpec({})).to.be.false
      expect(p.isSpec([])).to.be.false
      expect(p.isSpec(null)).to.be.false
      expect(p.isSpec(undefined)).to.be.false
    })

    it("should reject bad specs", () => {
      expect(p.isSpec({expr: "foo", value:"bar"})).to.be.false
      expect(p.isSpec({expr: "foo", field:"bar"})).to.be.false
      expect(p.isSpec({field: "foo", value:"bar"})).to.be.false
      expect(p.isSpec({field: "foo", value:"bar", expr: "baz"})).to.be.false
    })
  })

  describe("Property", () => {
    describe("construction", () => {

      /*
      it("should set undefined property attr value to null if no default is given", () => {
        const obj = new Some({a: {}})
        new MyProperty(obj, 'b')
        expect(obj.b).to.be.null
      })

      // it("should set undefined property attr value if a default is given", () => {
      //   const obj = new Some({a: {}})
      //   new MyProperty(obj, 'b', function(): number { return 10 } )
      //   expect(obj.b).to.be.equal(10)
      // })

      // it("should throw an Error for missing specifications", () => {
      //   function fn(): void {
      //     new MyProperty(new Some({a: {}}), 'a')
      //   }
      //   expect(fn).to.throw(Error, /^Invalid property specifier .*, must have exactly one of/)
      // })

      // it("should throw an Error for too many specifications", () => {
      //   function fn(): void {
      //     new MyProperty(new Some({a: {field: "foo", value:"bar"}}), 'a')
      //   }
      //   expect(fn).to.throw(Error, /^Invalid property specifier .*, must have exactly one of/)
      // })

      it("should throw an Error if a field spec is not a string", () => {
        function fn(): void {
          new MyProperty(new SomeSpecHasProps({a: {field: 10}}), 'a')
        }
        expect(fn).to.throw(Error, /^field value for property '.*' is not a string$/)
      })
      */

      it("should set a spec for object attr values", () => {
        const obj0 = new Some({number_spec: {value: 0}})
        expect(obj0.number_spec).to.be.equal({value: 0})

        const obj1 = new Some({number_spec: {field: "some_field"}})
        expect(obj1.number_spec).to.be.equal({field: "some_field"})

        const expr = new TestExpression()
        const obj2 = new Some({number_spec: {expr}})
        expect(obj2.number_spec).to.be.equal({expr})
      })

      /*
      it("should set a value spec for non-object attr values", () => {
        const obj = new Some({a: 10})
        const prop = new MyProperty(, 'a')
        expect(prop.spec).to.be.equal({value: 10})
      })
      */
    })

    describe("value", () => {
      /*
      it("should return a value if there is a value spec", () => {
        const p1 = new MyProperty(new Some(fixed), 'a')
        expect(p1.value()).to.be.equal(1)
        const p2 = new MyProperty(new Some(spec_value), 'a')
        expect(p2.value()).to.be.equal(2)
      })

      it("should return a transformed value if there is a value spec with transform", () => {
        const obj = new Some(spec_value_trans)
        const prop = new MyProperty(, 'a')
        expect(prop.value()).to.be.equal(3)
      })

      it("should allow a fixed null value", () => {
        const obj = new Some(spec_value_null)
        const prop = new MyProperty(, 'a')
        expect(prop.value()).to.be.null
      })

      it("should throw an Error otherwise", () => {
        function fn(): void {
          const obj = new Some(spec_field_only)
          const prop = new MyProperty(, 'a')
          prop.value()
        }
        expect(fn).to.throw(Error, "attempted to retrieve property value for property without value specification")
      })
      */
    })

    describe("array", () => {

      it("should return an array if there is a value spec", () => {
        const source = new ColumnDataSource({data: {foo: [0, 1, 2, 3, 10]}})
        const obj1 = new Some({number_spec: 1})
        const p1 = obj1.properties.number_spec
        const arr1 = p1.array(source)
        expect(arr1).to.be.equal(new Float64Array([1, 1, 1, 1, 1]))

        const obj2 = new Some({number_spec: {value: 2}})
        const p2 = obj2.properties.number_spec
        const arr2 = p2.array(source)
        expect(arr2).to.be.equal(new Float64Array([2, 2, 2, 2, 2]))
      })

      it("should return an array if there is a valid expr spec", () => {
        const source = new ColumnDataSource({data: {foo: [0, 1, 2, 3, 10]}})
        const obj = new Some({number_spec: {expr: new TestExpression()}})
        const prop = obj.properties.number_spec
        const arr = prop.array(source)
        expect(arr).to.be.equal(new Float64Array([0, 1, 2, 3, 4]))
      })

      it("should return an array if there is a valid field spec", () => {
        const source = new ColumnDataSource({data: {foo: [0, 1, 2, 3, 10]}})
        const obj = new Some({number_spec: {field: "foo"}})
        const prop = obj.properties.number_spec
        const arr = prop.array(source)
        expect(arr).to.be.equal(new Float64Array([0, 1, 2, 3, 10]))
      })

      it("should return an array if there is a valid field spec named 'field'", () => {
        const source = new ColumnDataSource({data: {field: [0, 1, 2, 3, 10]}})
        const obj = new Some({number_spec: {field: "field"}})
        const prop = obj.properties.number_spec
        const arr = prop.array(source)
        expect(arr).to.be.equal(new Float64Array([0, 1, 2, 3, 10]))
      })

      it("should throw an Error otherwise", () => {
        const source = new ColumnDataSource({data: {bar: [1, 2, 3]}})
        const obj = new Some({number_spec: {field: "foo"}})
        const prop = obj.properties.number_spec
        const arr = prop.array(source)
        expect(arr).to.be.equal(new Float64Array([NaN, NaN, NaN]))
      })

      it("should apply a spec transform to a field", () => {
        const source = new ColumnDataSource({data: {foo: [0, 1, 2, 3, 10]}})
        const obj = new Some({number_spec: {field: "foo", transform: new TestTransform()}} as any) // XXX: transform
        const prop = obj.properties.number_spec
        const arr = prop.array(source)
        expect(arr).to.be.equal(new Float64Array([0, 2, 4, 6, 14]))
      })

      it("should apply a spec transform to a value array", () => {
        const source = new ColumnDataSource({data: {foo: [0, 1, 2, 3, 10]}})
        const obj = new Some({number_spec: {value: 2, transform: new TestTransform()}} as any) // XXX: transform
        const prop = obj.properties.number_spec
        const arr = prop.array(source)
        expect(arr).to.be.equal(new Float64Array([2, 3, 4, 5, 6]))
      })

      describe("changing the property attribute value", () => {
        it("should trigger change on the property", () => {
          const obj = new Some({string_spec: {value: "foo"}})
          const prop = obj.properties.string_spec
          const stuff = {called: false}
          prop.change.connect(() => stuff.called = true)
          obj.string_spec = {value: "bar"}
          expect(stuff.called).to.be.true
        })
      })

      it("should update the spec", () => {
        const obj = new Some({string_spec: {value: "foo"}})
        const prop = obj.properties.string_spec
        obj.string_spec = {value: "bar"}
        expect(prop.spec).to.be.equal({value: "bar"})
      })
    })
  })

  describe("Anchor", () => {
    const obj = new Some({anchor: "top_left"})
    const prop = obj.properties.anchor

    describe("valid", () => {
      it("should return undefined on anchor input", () => {
        for (const x of enums.Anchor)
          expect(prop.valid(x)).to.be.true
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })
  })

  describe("Any", () => {
    class X {}
    const obj = new Some({any: new X()})
    const prop = obj.properties.any

    describe("valid", () => {
      it("should return undefined on any input", () => {
        for (const x of [true, null, undefined, 10, 10.2, "foo", [1, 2, 3], {}, new Some(), new X()])
          expect(prop.valid(x)).to.be.true
      })
    })
  })

  describe("AngleSpec", () => {
    describe("normalize", () => {
      it("should multiply radians by -1", () => {
        const obj = new Some({angle_spec: {value: 10, units: "rad"}})
        const prop = obj.properties.angle_spec
        expect(prop.normalize([-10, 0, 10, 20])).to.be.equal([10, -0, -10, -20])
      })

      it("should convert degrees to -1 * radians", () => {
        const obj = new Some({angle_spec: {value: 10, units: "deg"}})
        const prop = obj.properties.angle_spec
        expect(prop.normalize([-180, 0, 180])).to.be.equal([Math.PI, -0, -Math.PI])
      })
    })
  })

  describe("Array", () => {
    const obj = new Some({array: [1, 2, 3]})
    const prop = obj.properties.array

    describe("valid", () => {
      it("should return undefined on array input", () => {
        expect(prop.valid([])).to.be.true
        expect(prop.valid([1, 2, 3])).to.be.true
        expect(prop.valid(new Float64Array([1, 2, 3]))).to.be.true
      })

      it("should throw an Error on non-array input", () => {
        expect(prop.valid(true)).to.be.false
        expect(prop.valid(10)).to.be.false
        expect(prop.valid(10.2)).to.be.false
        expect(prop.valid("foo")).to.be.false
        expect(prop.valid({})).to.be.false
        expect(prop.valid(null)).to.be.false
        expect(prop.valid(undefined)).to.be.false
      })
    })
  })

  describe("Bool", () => {
    const obj = new Some({boolean: true})
    const prop = obj.properties.boolean

    describe("valid", () => {
      it("should return undefined on bool input", () => {
        expect(prop.valid(true)).to.be.true
        expect(prop.valid(false)).to.be.true
      })

      it("should throw an Error on non-boolean input", () => {
        expect(prop.valid(10)).to.be.false
        expect(prop.valid(10.2)).to.be.false
        expect(prop.valid("foo")).to.be.false
        expect(prop.valid({})).to.be.false
        expect(prop.valid([])).to.be.false
        expect(prop.valid(null)).to.be.false
        expect(prop.valid(undefined)).to.be.false
      })
    })
  })

  describe("Color", () => {
    const obj = new Some({color: "#aabbccdd"})
    const prop = obj.properties.color

    describe("valid", () => {

      const good_tuples = [
        "rgb(255, 0, 0)",
        "rgba(200, 0, 0, 0.5)",
        "rgba(0, 255, 0, 0)",
        "rgba(0, 0, 255, 1)",
      ]

      const bad_tuples = [
        "rgb(254.5, 0, 0)",
        "rgba(245.5, 0, 0, 0.5)",
        "rgba(255.0, 0, 0, 0.5)",
        "rgba(2550, 0, 0, 0.5)",
        "rgba(255, 0, 0, 5)",
        "rgb(255, 0, 0, 0)",
        "rgba(255, 0, 0, 0.5, 0)",
        "rgb( )",
        "rgb(a, b, c)",
      ]

      it("should return undefined on RGBa input", () => {
        expect(prop.valid("#aabbccdd")).to.be.true
      })

      describe("should return undefined on good integer rgb and rgba tuples", () => {
        for (const good_tuple of good_tuples) {
          it(`${good_tuple}`, () => {
            expect(prop.valid(good_tuple)).to.be.true
          })
        }
      })

      describe("should throw Error on tuple with bad numerical values", () => {
        for (const bad_tuple of bad_tuples) {
          it(`${bad_tuple}`, () => {
            expect(prop.valid(bad_tuple)).to.be.false
          })
        }
      })

      it("should return undefined on svg color input", () => {
        for (const color in svg_colors) {
          expect(prop.valid(color)).to.be.true
        }
      })

      it("should throw an Error on other input", () => {
        expect(prop.valid(true)).to.be.false
        expect(prop.valid(10)).to.be.false
        expect(prop.valid(10.2)).to.be.false
        expect(prop.valid("foo")).to.be.false
        expect(prop.valid({})).to.be.false
        expect(prop.valid([])).to.be.false
        expect(prop.valid(null)).to.be.false
        expect(prop.valid(undefined)).to.be.false
      })
    })
  })

  describe("Direction", () => {
    const obj = new Some({direction: "clock"})
    const prop = obj.properties.direction

    describe("valid", () => {
      it("should return undefined on direction input", () => {
        expect(prop.valid("clock")).to.be.true
        expect(prop.valid("anticlock")).to.be.true
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("normalize", () => {
      it("should convert 'clock' to false", () => {
        const result = prop.normalize(["clock"])
        expect(result).to.be.equal(new Uint8Array([0]))
      })

      it("should convert 'anticlock' to true", () => {
        const result = prop.normalize(["anticlock"])
        expect(result).to.be.equal(new Uint8Array([1]))
      })

      it("should return a Uint8Array", () => {
        const result = prop.normalize(["clock", "anticlock"])
        expect(result).to.be.equal(new Uint8Array([0, 1]))
      })
    })
  })

  describe("DistanceSpec", () => {

    describe("units", () => {
      it("should default to data units", () => {
        const obj = new Some({distance_spec: {value: 10}})
        const prop = obj.properties.distance_spec
        expect(prop.spec.units).to.be.equal("data")
      })

      it("should accept screen units", () => {
        const obj = new Some({distance_spec: {value: 10, units: "screen"}})
        const prop = obj.properties.distance_spec
        expect(prop.spec.units).to.be.equal("screen")
      })

      it("should accept data units", () => {
        const obj = new Some({distance_spec: {value: 10, units: "data"}})
        const prop = obj.properties.distance_spec
        expect(prop.spec.units).to.be.equal("data")
      })

      it("should throw an Error on bad units", () => {
        expect(() => {
          new Some({distance_spec: {value: 10, units: "bad"}})
        }).to.throw(Error, "units must be one of screen, data; got: bad")
      })
    })
  })

  describe("Font", () => {
    const obj = new Some({font: "times"})
    const prop = obj.properties.font

    describe("valid", () => {
      it("should return undefined on font input", () => {
        expect(prop.valid("")).to.be.true
        expect(prop.valid("helvetica")).to.be.true
      })

      it("should throw an Error on non-string input", () => {
        expect(prop.valid(true)).to.be.false
        expect(prop.valid(10)).to.be.false
        expect(prop.valid(10.2)).to.be.false
        expect(prop.valid({})).to.be.false
        expect(prop.valid([])).to.be.false
        expect(prop.valid(null)).to.be.false
        expect(prop.valid(undefined)).to.be.false
      })
    })
  })

  describe("Instance", () => {
    const obj = new Some({instance: new Some()})
    const prop = obj.properties.instance

    describe("valid", () => {
      it("should return undefined on HasProps", () => {
        const value = new Some()
        expect(prop.valid(value)).to.be.true
      })

      it.skip("should throw an Error on other input", () => {
        expect(prop.valid(true)).to.be.false
        expect(prop.valid(10)).to.be.false
        expect(prop.valid(10.2)).to.be.false
        expect(prop.valid("foo")).to.be.false
        expect(prop.valid({})).to.be.false
        expect(prop.valid([])).to.be.false
      })
    })
  })

  describe("Number", () => {
    const obj = new Some({number: 10})
    const prop = obj.properties.number

    describe("valid", () => {
      it("should return undefined on numeric input", () => {
        expect(prop.valid(10)).to.be.true
        expect(prop.valid(10.2)).to.be.true
      })

      it("should throw an Error on non-numeric input", () => {
        // expect(prop.valid(true) // XXX should this succeed?
        expect(prop.valid("foo")).to.be.false
        expect(prop.valid({})).to.be.false
        expect(prop.valid([])).to.be.false
        expect(prop.valid(null)).to.be.false
        expect(prop.valid(undefined)).to.be.false
        expect(prop.valid(new Some())).to.be.false
      })
    })
  })

  describe("String", () => {
    const obj = new Some({string: "foo"})
    const prop = obj.properties.string

    describe("valid", () => {
      it("should return undefined on string input", () => {
        expect(prop.valid("")).to.be.true
        expect(prop.valid("foo")).to.be.true
        expect(prop.valid("1")).to.be.true
      })

      it("should throw an Error on non-string input", () => {
        expect(prop.valid(true)).to.be.false
        expect(prop.valid(10)).to.be.false
        expect(prop.valid(10.2)).to.be.false
        expect(prop.valid({})).to.be.false
        expect(prop.valid([])).to.be.false
        expect(prop.valid(null)).to.be.false
        expect(prop.valid(undefined)).to.be.false
      })
    })
  })
})
