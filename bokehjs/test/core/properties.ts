import {expect} from "chai"

import * as p from "core/properties"
import * as enums from "core/enums"

import {HasProps} from  "core/has_props"
import {ColumnDataSource} from "models/sources/column_data_source"
import {svg_colors} from  "core/util/svg_colors"
import {Transform} from  "models/transforms/transform"
import {Expression} from  "models/expressions/expression"

class TestTransform extends Transform {
  compute(x: number): number {
    return x+1
  }
  v_compute(xs: number[]): number[] {
    const ret =  []
    for (let i=0; i<xs.length; i++)
      ret.push(xs[i]+i)
    return ret
  }
}

class TestExpression extends Expression {
  _v_compute(source: ColumnDataSource): number[] {
    const ret = []
    for (let i=0; i<source.get_length()!; i++)
      ret.push(i)
    return ret
  }
}

class SomeHasProps extends HasProps {
  a: any
  b: any
}
SomeHasProps.define({
  a: [ p.Any ],
  b: [ p.Any ],
})
SomeHasProps.prototype.type = 'SomeHasProps'

class SomeSpecHasProps extends HasProps {
  a: any
  b: any
}
SomeSpecHasProps.define({
  a: [ p.NumberSpec ],
  b: [ p.Any ],
})
SomeSpecHasProps.prototype.type =  'SomeSpecHasProps'

class DataSpecProperty extends p.Number {}
DataSpecProperty.prototype.dataspec = true

describe("properties module", () => {

  function validation_error(prop: any, x: any): void {
    function fn(): void {
      prop.validate(x)
    }
    expect(fn).to.throw(Error, /property '.*' given invalid value/)
  }

  function enum_validation_errors(prop: any): void {
    validation_error(prop, true)
    validation_error(prop, 10)
    validation_error(prop, 10.2)
    validation_error(prop, "foo")
    validation_error(prop, {})
    validation_error(prop, [])
    validation_error(prop, null)
    validation_error(prop, undefined)
    validation_error(prop, new SomeHasProps())
  }

  const fixed            = {a: 1}
  const spec_expr        = {a: {expr: new TestExpression()}}
  const spec_field       = {a: {field: 'foo'}, b: 30}
  const spec_field_only  = {a: {field: 'foo'}}
  const spec_field_trans = {a: {field: 'foo', transform: new TestTransform()}}
  const spec_value       = {a: {value: 2}}
  const spec_value_trans = {a: {value: 2, transform: new TestTransform()}}
  const spec_value_null  = {a: {value: null}}

  const DATASPECS = [ "AngleSpec", "ColorSpec", "DistanceSpec", "FontSizeSpec", "NumberSpec", "StringSpec" ]

  const PROPERTIES = [
    "Any",
    "Anchor",
    "Angle",
    "AngleUnits",
    "Array",
    "Bool",
    "Color",
    "Dimension",
    "Direction",
    "Font",
    "FontStyle",
    "Instance",
    "LegendLocation",
    "FontSize",
    "FontStyle",
    "LineCap",
    "LineJoin",
    "Location",
    "Orientation",
    "Number",
    "RenderLevel",
    "RenderMode",
    "SpatialUnits",
    "String",
    "TextAlign",
    "TextBaseline",
  ]
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

      it("should set undefined property attr value to null if no default is given", () => {
        const obj = new SomeHasProps({a: {}})
        new p.Property(obj, 'b')
        expect(obj.b).to.be.null
      })

      // it("should set undefined property attr value if a default is given", () => {
      //   const obj = new SomeHasProps({a: {}})
      //   new p.Property(obj, 'b', function(): number { return 10 } )
      //   expect(obj.b).to.be.equal(10)
      // })

      // it("should throw an Error for missing specifications", () => {
      //   function fn(): void {
      //     new p.Property(new SomeHasProps({a: {}}), 'a')
      //   }
      //   expect(fn).to.throw(Error, /^Invalid property specifier .*, must have exactly one of/)
      // })

      // it("should throw an Error for too many specifications", () => {
      //   function fn(): void {
      //     new p.Property(new SomeHasProps({a: {field: "foo", value:"bar"}}), 'a')
      //   }
      //   expect(fn).to.throw(Error, /^Invalid property specifier .*, must have exactly one of/)
      // })

      it("should throw an Error if a field spec is not a string", () => {
        function fn(): void {
          new p.Property(new SomeSpecHasProps({a: {field: 10}}), 'a')
        }
        expect(fn).to.throw(Error, /^field value for property '.*' is not a string$/)
      })

      it("should set a spec for object attr values", () => {
        const p1 = new p.Property(new SomeHasProps({a: {field: "foo"}}), 'a')
        expect(p1.spec).to.be.deep.equal({field: "foo"})
        const p2 = new p.Property(new SomeHasProps({a: {value: "foo"}}), 'a')
        expect(p2.spec).to.be.deep.equal({value: "foo"})
      })

      it("should set a value spec for non-object attr values", () => {
        const prop = new p.Property(new SomeHasProps({a: 10}), 'a')
        expect(prop.spec).to.be.deep.equal({value: 10})
      })

    })

    describe("value", () => {
      it("should return a value if there is a value spec", () => {
        const p1 = new p.Property(new SomeHasProps(fixed), 'a')
        expect(p1.value()).to.be.equal(1)
        const p2 = new p.Property(new SomeHasProps(spec_value), 'a')
        expect(p2.value()).to.be.equal(2)
      })

      it("should return a transformed value if there is a value spec with transform", () => {
        const prop = new p.Property(new SomeHasProps(spec_value_trans), 'a')
        expect(prop.value()).to.be.equal(3)
      })

      it("should allow a fixed null value", () => {
        const prop = new p.Property(new SomeHasProps(spec_value_null), 'a')
        expect(prop.value()).to.be.null
      })

      it("should throw an Error otherwise", () => {
       function fn(): void {
          const prop = new p.Property(new SomeHasProps(spec_field_only), 'a')
          prop.value()
       }
        expect(fn).to.throw(Error, "attempted to retrieve property value for property without value specification")
      })

    })

    describe("array", () => {

      it("should throw an Error for non data-specs", () => {
        function fn(): void {
          const source = new ColumnDataSource({data: {foo: [0,1,2,3,10]}})
          const prop = new p.Property(new SomeHasProps(spec_field), 'a')
          prop.array(source)
        }
        expect(fn).to.throw(Error, /attempted to retrieve property array for non-dataspec property/)
      })

      // XXX TODO
      it("should return a computed array if there is an expr spec", () => {

      })

      it("should return an array if there is a value spec", () => {
        const source = new ColumnDataSource({data: {foo: [0,1,2,3,10]}})
        const p1 = new DataSpecProperty(new SomeSpecHasProps(fixed), 'a')
        const arr1 = p1.array(source)
        expect(arr1).to.be.instanceof(Array)
        expect(arr1.length).to.be.equal(5)
        expect(arr1[0]).to.be.equal(1)
        expect(arr1[1]).to.be.equal(1)
        expect(arr1[2]).to.be.equal(1)
        expect(arr1[3]).to.be.equal(1)
        expect(arr1[4]).to.be.equal(1)

        const p2 = new DataSpecProperty(new SomeSpecHasProps(spec_value), 'a')
        const arr2 = p2.array(source)
        expect(arr2).to.be.instanceof(Array)
        expect(arr2.length).to.be.equal(5)
        expect(arr2[0]).to.be.equal(2)
        expect(arr2[1]).to.be.equal(2)
        expect(arr2[2]).to.be.equal(2)
        expect(arr2[3]).to.be.equal(2)
        expect(arr2[4]).to.be.equal(2)
      })

      it("should return an array if there is a valid expr spec", () => {
        const source = new ColumnDataSource({data: {foo: [0,1,2,3,10]}})
        const prop = new DataSpecProperty(new SomeSpecHasProps(spec_expr), 'a')
        const arr = prop.array(source)
        expect(arr).to.be.instanceof(Array)
        expect(arr.length).to.be.equal(5)
        expect(arr[0]).to.be.equal(0)
        expect(arr[1]).to.be.equal(1)
        expect(arr[2]).to.be.equal(2)
        expect(arr[3]).to.be.equal(3)
        expect(arr[4]).to.be.equal(4)
      })

      it("should return an array if there is a valid field spec", () => {
        const source = new ColumnDataSource({data: {foo: [0,1,2,3,10]}})
        const prop = new DataSpecProperty(new SomeSpecHasProps(spec_field), 'a')
        const arr = prop.array(source)
        expect(arr).to.be.instanceof(Array)
        expect(arr.length).to.be.equal(5)
        expect(arr[0]).to.be.equal(0)
        expect(arr[1]).to.be.equal(1)
        expect(arr[2]).to.be.equal(2)
        expect(arr[3]).to.be.equal(3)
        expect(arr[4]).to.be.equal(10)
      })

      it("should return an array if there is a valid field spec named 'field'", () => {
        const source = new ColumnDataSource({data: {field: [0,1,2,3,10]}})
        const prop = new DataSpecProperty(new SomeSpecHasProps({a: {field: 'field'}, b: 30}), 'a')
        const arr = prop.array(source)
        expect(arr).to.be.instanceof(Array)
        expect(arr.length).to.be.equal(5)
        expect(arr[0]).to.be.equal(0)
        expect(arr[1]).to.be.equal(1)
        expect(arr[2]).to.be.equal(2)
        expect(arr[3]).to.be.equal(3)
        expect(arr[4]).to.be.equal(10)
      })

      it("should throw an Error otherwise", () => {
        function fn(): void {
          const source = new ColumnDataSource({data: {}})
          const prop = new DataSpecProperty(new SomeSpecHasProps(spec_field), 'a')
          prop.array(source)
        }
        expect(fn).to.throw(Error, /attempted to retrieve property array for nonexistent field 'foo'/)
      })

      it("should apply a spec transform to a field", () => {
        const source = new ColumnDataSource({data: {foo: [0,1,2,3,10]}})
        const prop = new DataSpecProperty(new SomeSpecHasProps(spec_field_trans), 'a')
        const arr = prop.array(source)
        expect(arr).to.be.instanceof(Array)
        expect(arr.length).to.be.equal(5)
        expect(arr[0]).to.be.equal(0)
        expect(arr[1]).to.be.equal(2)
        expect(arr[2]).to.be.equal(4)
        expect(arr[3]).to.be.equal(6)
        expect(arr[4]).to.be.equal(14)
      })

      it("should apply a spec transform to a value array", () => {
        const source = new ColumnDataSource({data: {foo: [0,1,2,3,10]}})
        const prop = new DataSpecProperty(new SomeSpecHasProps(spec_value_trans), 'a')
        const arr = prop.array(source)
        expect(arr).to.be.instanceof(Array)
        expect(arr.length).to.be.equal(5)
        expect(arr[0]).to.be.equal(2)
        expect(arr[1]).to.be.equal(3)
        expect(arr[2]).to.be.equal(4)
        expect(arr[3]).to.be.equal(5)
        expect(arr[4]).to.be.equal(6)
      })

    describe("init", () => {
      it("should return nothing by default", () => {
        const prop = new p.Property(new SomeHasProps({a: {value: "foo"}}), 'a')
        expect(prop.init()).to.be.undefined
      })
    })

    describe("transform", () => {
      it("should be the identity", () => {
        expect(p.Property.prototype.transform(10)).to.be.equal(10)
        expect(p.Property.prototype.transform("foo")).to.be.equal("foo")
        expect(p.Property.prototype.transform(null)).to.be.null
      })

      it("should return the same type as passed", () => {
        const r1 = p.Number.prototype.transform([10, 20, 30])
        expect(r1).to.be.deep.equal([10, 20, 30])
        const r2 = p.Number.prototype.transform(new Float64Array([10, 20, 30]))
        expect(r2).to.be.deep.equal(new Float64Array([10, 20, 30]))
      })
    })

    describe("validate", () => {
      it("should return nothing by default", () => {
        const prop = new p.Property(new SomeHasProps({a: {value: "foo"}}), 'a')
        expect(prop.validate(undefined)).to.be.undefined
        expect(prop.validate(10)).to.be.undefined
        expect(prop.validate("foo")).to.be.undefined
        expect(prop.validate(null)).to.be.undefined
      })
    })

    describe("changing the property attribute value", () => {
      it("should trigger change on the property", () => {
        const obj = new SomeHasProps({a: {value: "foo"}})
        const prop = obj.properties.a
        const stuff = {called: false}
        prop.change.connect(function fn(): void { stuff.called = true})
        obj.a = {value: "bar"}
        expect(stuff.called).to.be.true
      })
    })

      it("should update the spec", () => {
        const obj = new SomeHasProps({a: {value: "foo"}})
        const prop = obj.properties.a
        obj.a = {value: "bar"}
        expect(prop.spec).to.be.deep.equal({value: "bar"})
      })

    })

  })

  describe("Anchor", () => {
    const prop = new p.Anchor(new SomeHasProps({a: {value: "top_left"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on anchor input", () => {
        for (const x of enums.LegendLocation)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Any", () => {
    const prop = new p.Any(new SomeHasProps({a: {value: "top_left"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on any input", () => {
        for (const x of [true, null, undefined, 10, 10.2, "foo", [1,2,3], {}, new SomeHasProps()])
          expect(prop.validate(x)).to.be.undefined
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Angle", () => {

    it("should be an instance of Number", () => {
      const prop = new p.Angle(new SomeHasProps({a: {value: 10}}), 'a')
      expect(prop).to.be.instanceof(p.Number)
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        const prop = new p.Angle(new SomeHasProps({a: {value: 10}}), 'a')
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("AngleSpec", () => {
    describe("transform", () => {
      it("should multiply radians by -1", () => {
        const prop = new p.AngleSpec(new SomeHasProps({a: {value: 10, units: "rad"}}), 'a')
        expect(prop.transform([-10, 0, 10, 20])).to.be.deep.equal([10, -0, -10, -20])
      })

      it("should convert degrees to -1 * radians", () => {
        const prop = new p.AngleSpec(new SomeHasProps({a: {value: 10, units: "deg"}}), 'a')
        expect(prop.transform([-180, 0, 180])).to.be.deep.equal([Math.PI, -0, -Math.PI])
      })
    })
  })

  describe("Array", () => {
    const prop = new p.Array(new SomeHasProps({a: {field: "foo"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on array input", () => {
        expect(prop.validate([])).to.be.undefined
        expect(prop.validate([1,2,3])).to.be.undefined
        expect(prop.validate(new Float64Array([1,2,3]))).to.be.undefined
      })

      it("should throw an Error on non-array input", () => {
        validation_error(prop, true)
        validation_error(prop, 10)
        validation_error(prop, 10.2)
        validation_error(prop, "foo")
        validation_error(prop, {})
        validation_error(prop, null)
        validation_error(prop, undefined)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Bool", () => {
    const prop = new p.Bool(new SomeHasProps({a: {value: true}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {

      it("should return undefined on bool input", () => {
        expect(prop.validate(true)).to.be.undefined
        expect(prop.validate(false)).to.be.undefined
      })

      it("should throw an Error on non-boolean input", () => {
        validation_error(prop, 10)
        validation_error(prop, 10.2)
        validation_error(prop, "foo")
        validation_error(prop, {})
        validation_error(prop, [])
        validation_error(prop, null)
        validation_error(prop, undefined)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Color", () => {
    const prop = new p.Color(new SomeHasProps({a: {value: "#aabbccdd"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {

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
        expect(prop.validate("#aabbccdd")).to.be.undefined
      })

      describe("should return undefined on good integer rgb and rgba tuples", () => {
        for (const good_tuple of good_tuples) {
          it(`${good_tuple}`, () => {
            expect(prop.validate(good_tuple)).to.be.undefined
          })
        }
      })

      describe("should throw Error on tuple with bad numerical values", () => {
        for (const bad_tuple of bad_tuples) {
          it(`${bad_tuple}`, () => {
            function fn(): void {
              prop.validate(bad_tuple)
            }
            expect(fn).to.throw(Error)
          })
        }
      })

      it("should return undefined on svg color input", () => {
        for (const color in svg_colors)
          expect(prop.validate(color)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        validation_error(prop, true)
        validation_error(prop, 10)
        validation_error(prop, 10.2)
        validation_error(prop, "foo")
        validation_error(prop, {})
        validation_error(prop, [])
        validation_error(prop, null)
        validation_error(prop, undefined)
      })
    })

  })

  describe("Dimension", () => {
    const prop = new p.Dimension(new SomeHasProps({a: {value: "width"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on dimension input", () => {
        for (const x of enums.Dimension)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Direction", () => {
    const prop = new p.Direction(new SomeHasProps({a: {value: "clock"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on direction input", () => {
        expect(prop.validate("clock")).to.be.undefined
        expect(prop.validate("anticlock")).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should convert 'clock' to false", () => {
        const result = prop.transform(["clock"])
        expect(result).to.be.deep.equal(new Uint8Array([0]))
      })

      it("should convert 'anticlock' to true", () => {
        const result = prop.transform(["anticlock"])
        expect(result).to.be.deep.equal(new Uint8Array([1]))
      })

      it("should return a Uint8Array", () => {
        const result = prop.transform(["clock", "anticlock"])
        expect(result).to.be.deep.equal(new Uint8Array([0, 1]))
      })
    })

  })

  describe("DistanceSpec", () => {

    it("should be an instance of Number", () => {
      const prop = new p.DistanceSpec(new SomeHasProps({a: {value: 10}}), 'a')
      expect(prop).to.be.instanceof(p.Number)
    })

    describe("units", () => {
      it("should default to data units", () => {
        const prop = new p.DistanceSpec(new SomeHasProps({a: {value: 10}}), 'a')
        expect(prop.spec.units).to.be.equal("data")
      })

      it("should accept screen units", () => {
        const prop = new p.DistanceSpec(new SomeHasProps({a: {value: 10, units:"screen"}}), 'a')
        expect(prop.spec.units).to.be.equal("screen")
      })

      it("should accept data units", () => {
        const prop = new p.DistanceSpec(new SomeHasProps({a: {value: 10, units:"data"}}), 'a')
        expect(prop.spec.units).to.be.equal("data")
      })

      it("should throw an Error on bad units", () => {
        function fn(): void {
          new p.DistanceSpec(new SomeHasProps({a: {value: 10, units:"bad"}}), 'a')
        }
        expect(fn).to.throw(Error, "DistanceSpec units must be one of screen,data, given invalid value: bad")
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        const prop = new p.DistanceSpec(new SomeHasProps({a: {value: 10}}), 'a')
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Font", () => {
    const prop = new p.Font(new SomeHasProps({a: {value: "times"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on font input", () => {
        expect(prop.validate("")).to.be.undefined
        expect(prop.validate("helvetica")).to.be.undefined
      })

      it("should throw an Error on non-string input", () => {
        validation_error(prop, true)
        validation_error(prop, 10)
        validation_error(prop, 10.2)
        validation_error(prop, {})
        validation_error(prop, [])
        validation_error(prop, null)
        validation_error(prop, undefined)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("FontStyle", () => {
    const prop = new p.FontStyle(new SomeHasProps({a: {value: "normal"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on font style input", () => {
        for (const x of enums.FontStyle)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Instance", () => {
    const prop = new p.Instance(new SomeHasProps({a: null}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on HasProps", () => {
        expect(prop.validate(new SomeHasProps({}))).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        validation_error(prop, true)
        validation_error(prop, 10)
        validation_error(prop, 10.2)
        validation_error(prop, "foo")
        validation_error(prop, {})
        validation_error(prop, [])
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("LegendLocation", () => {
    const prop = new p.LegendLocation(new SomeHasProps({a: {value: "top_left"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on legend location input", () => {
        for (const x of enums.LegendLocation)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("LineCap", () => {
    const prop = new p.LineCap(new SomeHasProps({a: {value: "butt"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on line cap input", () => {
        for (const x of enums.LineCap)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("LineJoin", () => {
    const prop = new p.LineJoin(new SomeHasProps({a: {value: "miter"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on line join input", () => {
        for (const x of enums.LineJoin)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Number", () => {
    const prop = new p.Number(new SomeHasProps({a: {value: 10}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on numeric input", () => {
        expect(prop.validate(10)).to.be.undefined
        expect(prop.validate(10.2)).to.be.undefined
      })

      it("should throw an Error on non-numeric input", () => {
        // validation_error(prop, true) // XXX should this succeed?
        validation_error(prop, "foo")
        validation_error(prop, {})
        validation_error(prop, [])
        validation_error(prop, null)
        validation_error(prop, undefined)
        validation_error(prop, new SomeHasProps())
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("Orientation", () => {
    const prop = new p.Orientation(new SomeHasProps({a: {value: "vertical"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on orientation input", () => {
        for (const x of enums.Orientation)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("RenderLevel", () => {
    const prop = new p.RenderLevel(new SomeHasProps({a: {value: "glyph"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on render level input", () => {
        for (const x of enums.RenderLevel)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("RenderMode", () => {
    const prop = new p.RenderMode(new SomeHasProps({a: {value: "canvas"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on render mode input", () => {
        for (const x of enums.RenderMode)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("String", () => {
    const prop = new p.String(new SomeHasProps({a: {value: "foo"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on string input", () => {
        expect(prop.validate("")).to.be.undefined
        expect(prop.validate("foo")).to.be.undefined
        expect(prop.validate("1")).to.be.undefined
      })

      it("should throw an Error on non-string input", () => {
        validation_error(prop, true)
        validation_error(prop, 10)
        validation_error(prop, 10.2)
        validation_error(prop, {})
        validation_error(prop, [])
        validation_error(prop, null)
        validation_error(prop, undefined)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("TextAlign", () => {
    const prop = new p.TextAlign(new SomeHasProps({a: {value: "left"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on text align input", () => {
        for (const x of enums.TextAlign)
          expect(prop.validate(x)).to.be.undefined
      })

      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("TextBaseline", () => {
    const prop = new p.TextBaseline(new SomeHasProps({a: {value: "top"}}), 'a')

    it("should be an instance of Property", () => {
      expect(prop).to.be.instanceof(p.Property)
    })

    describe("validate", () => {
      it("should return undefined on text baseline input", () => {
        for (const x of enums.TextBaseline)
          expect(prop.validate(x)).to.be.undefined
      })
      it("should throw an Error on other input", () => {
        enum_validation_errors(prop)
      })
    })

    describe("transform", () => {
      it("should be Property.transform", () => {
        expect(prop.transform).to.be.equal(p.Property.prototype.transform)
      })
    })

  })

  describe("dataspec prototype property", () => {

    for (const ds of DATASPECS) {
      it(`DataSpec ${ds} should have dataspec attribute set true`, () => {
        expect(((p as any)[ds] as any).prototype.dataspec).to.be.true
      })
    }

    for (const prop of PROPERTIES) {
      it(`Property ${prop} should have dataspec attribute set false`, () => {
        expect(((p as any)[prop] as any).prototype.dataspec).to.be.false
      })
    }

  })

  describe("exports", () => {

    for (const func of ["simple_prop", "enum_prop", "units_prop"]) {
      it(`should have '${func}' property helper function`, () => {
        expect(func in p).to.be.true
      })
    }

    it("should have the Property base class", () => {
      expect("Property" in p).to.be.true
    })

    for (const prop of PROPERTIES) {
      it(`should have simple property ${prop}`, () => {
        expect(prop in p).to.be.true
      })
    }

    for (const ds of DATASPECS) {
      it(`should have dataspec property ${ds}`, () => {
        expect(ds in p).to.be.true
      })
    }

  })

})
