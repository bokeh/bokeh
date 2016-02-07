{expect} = require "chai"
utils = require "../utils"

properties = utils.require "core/properties"

HasProps = utils.require "core/has_props"
enums = utils.require "core/enums"
ColumnDataSource = utils.require("models/sources/column_data_source").Model
svg_colors = utils.require "core/util/svg_colors"

class SomeHasProps extends HasProps
  type: 'SomeHasProps'

describe "properties module", ->

  validation_error = (prop, x) ->
    fn = ->
      prop.validate x
      expect(fn).to.throw Error, /property '.*' given invalid value/

  enum_validation_errors = (prop) ->
    validation_error prop, true
    validation_error prop, 10
    validation_error prop, 10.2
    validation_error prop, "foo"
    validation_error prop, {}
    validation_error prop, []
    validation_error prop, null
    validation_error prop, undefined

  fixed           = {a: 1}
  spec_field      = {a: {field: 'foo'}, b: 30}
  spec_field_only = {a: {field: 'foo'}}
  spec_value      = {a: {value: 2}}
  spec_value_null = {a: {value: null}}

  describe "Property", ->

    describe "construction", ->

      it "should throw an Error for missing property object", ->
        fn = ->
          new properties.Property({attr: 'a'})
        expect(fn).to.throw Error, "missing property object"

      it "should throw an Error for non-HasProps property object", ->
        fn = ->
          new properties.Property({obj: 10, attr: 'a'})
        expect(fn).to.throw Error, "property object must be a HasProps"

      it "should throw an Error for missing property attr", ->
        fn = ->
          new properties.Property({obj: new SomeHasProps(a: {})})
        expect(fn).to.throw Error, "missing property attr"

      it "should set undefined property attr value to null if no default is given", ->
        obj = new SomeHasProps(a: {})
        p = new properties.Property({obj: obj, attr: 'b'})
        expect(obj.get('b')).to.be.equal null

      it "should set undefined property attr value if a default is given", ->
        obj = new SomeHasProps(a: {})
        p = new properties.Property({obj: obj, attr: 'b', default_value: 10})
        expect(obj.get('b')).to.be.equal 10

      it "should throw an Error for missing specifications", ->
        fn = ->
          new properties.Property({obj: new SomeHasProps(a: {}), attr: 'a'})
        expect(fn).to.throw Error, /^Invalid property specifier .*, must have exactly one of/

      it "should throw an Error for too many specifications", ->
        fn = ->
          new properties.Property({obj: new SomeHasProps(a: {field: "foo", value:"bar"}), attr: 'a'})
        expect(fn).to.throw Error, /^Invalid property specifier .*, must have exactly one of/

      it "should throw an Error if a field spec is not a string", ->
        fn = ->
          new properties.Property({obj: new SomeHasProps(a: {field: 10}), attr: 'a'})
        expect(fn).to.throw Error, /^field value for property '.*' is not a string$/

      it "should set a spec for object attr values", ->
        p = new properties.Property({obj: new SomeHasProps(a: {field: "foo"}), attr: 'a'})
        expect(p.spec).to.be.deep.equal {field: "foo"}
        p = new properties.Property({obj: new SomeHasProps(a: {value: "foo"}), attr: 'a'})
        expect(p.spec).to.be.deep.equal {value: "foo"}

      it "should set a value spec for non-object attr values", ->
        p = new properties.Property({obj: new SomeHasProps(a: 10), attr: 'a'})
        expect(p.spec).to.be.deep.equal {value: 10}

    describe "re-setting obj and attr properties", ->
      it "should throw an Error", ->
        prop = new properties.Property({obj: new SomeHasProps(a: {value: 10}), attr: 'a'})
        fn = ->
          prop.set('obj', new SomeHasProps(a: {value: 20}))
        expect(fn).to.throw Error, "attempted to reset 'obj' on Property"
        fn = ->
          prop.set('attr', 'b')
        expect(fn).to.throw Error, "attempted to reset 'attr' on Property"


    describe "value", ->
      it "should return a value if there is a value spec", ->
        prop = new properties.Property({obj: new SomeHasProps(fixed), attr: 'a'})
        expect(prop.value()).to.be.equal 1
        prop = new properties.Property({obj: new SomeHasProps(spec_value), attr: 'a'})
        expect(prop.value()).to.be.equal 2

      it "should allow a fixed null value", ->
        prop = new properties.Property({obj: new SomeHasProps(spec_value_null), attr: 'a'})
        expect(prop.value()).to.be.equal null

      it "should throw an Error otherwise", ->
        fn = ->
          prop = new properties.Property({obj: new SomeHasProps(spec_field_only), attr: 'a'})
          prop.value()
        expect(fn).to.throw Error, "attempted to retrieve property value for property without value specification"

    describe "array", ->
      source = new ColumnDataSource({data: {foo: [0,1,2,3,10]}})

      it "should return an array if there is a value spec", ->
        prop = new properties.Property({obj: new SomeHasProps(fixed), attr: 'a'})
        arr = prop.array(source)
        expect(arr).to.be.instanceof Array
        expect(arr.length).to.be.equal 5
        expect(arr[0]).to.be.equal 1
        expect(arr[1]).to.be.equal 1
        expect(arr[2]).to.be.equal 1
        expect(arr[3]).to.be.equal 1
        expect(arr[4]).to.be.equal 1

        prop = new properties.Property({obj: new SomeHasProps(spec_value), attr: 'a'})
        arr = prop.array(source)
        expect(arr).to.be.instanceof Array
        expect(arr.length).to.be.equal 5
        expect(arr[0]).to.be.equal 2
        expect(arr[1]).to.be.equal 2
        expect(arr[2]).to.be.equal 2
        expect(arr[3]).to.be.equal 2
        expect(arr[4]).to.be.equal 2

      it "should return an array if there is a valid field spec", ->
        prop = new properties.Property({obj: new SomeHasProps(spec_field), attr: 'a'})
        arr = prop.array(source)
        expect(arr).to.be.instanceof Array
        expect(arr.length).to.be.equal 5
        expect(arr[0]).to.be.equal 0
        expect(arr[1]).to.be.equal 1
        expect(arr[2]).to.be.equal 2
        expect(arr[3]).to.be.equal 3
        expect(arr[4]).to.be.equal 10

      # TODO (bev) this is a really misleading error
      it "should throw an Error otherwise", ->
        fn = ->
          source = new ColumnDataSource({data: {}})
          prop = new properties.Property({obj: new SomeHasProps(spec_field), attr: 'a'})
          arr = prop.array(source)
        expect(fn).to.throw Error, /attempted to retrieve property value for property without value specification/

    describe "init", ->
      it "should return nothing by default", ->
        p = new properties.Property({obj: new SomeHasProps(a: {value: "foo"}), attr: 'a'})
        expect(p.init()).to.be.equal undefined

    describe "transform", ->
      it "should be the identity", ->
        expect(properties.Property.prototype.transform(10)).to.be.equal 10
        expect(properties.Property.prototype.transform("foo")).to.be.equal "foo"
        expect(properties.Property.prototype.transform(null)).to.be.equal null

      it "should return the same type as passed", ->
        result = properties.Number.prototype.transform [10, 20, 30]
        expect(result).to.be.deep.equal [10, 20, 30]
        result = properties.Number.prototype.transform new Float64Array [10, 20, 30]
        expect(result).to.be.deep.equal new Float64Array [10, 20, 30]

    describe "validate", ->
      it "should return nothing by default", ->
        p = new properties.Property({obj: new SomeHasProps(a: {value: "foo"}), attr: 'a'})
        expect(p.validate()).to.be.equal undefined
        expect(p.validate(10)).to.be.equal undefined
        expect(p.validate("foo")).to.be.equal undefined
        expect(p.validate(null)).to.be.equal undefined

    describe "changing the property attribute value", ->
      it "should trigger change on the property", ->
        obj = new SomeHasProps(a: {value: "foo"})
        prop = new properties.Property({obj: obj, attr: 'a'})
        stuff = {called: false}
        prop.listenTo(prop, 'change', () -> stuff.called = true)
        obj.set('a', {value: "bar"})
        expect(stuff.called).to.be.true

      it "should update the spec", ->
        obj = new SomeHasProps(a: {value: "foo"})
        prop = new properties.Property({obj: obj, attr: 'a'})
        obj.set('a', {value: "bar"})
        expect(prop.spec).to.be.deep.equal {value: "bar"}

  describe "Angle", ->

    it "should be an instance of Number", ->
      prop = new properties.Angle({obj: new SomeHasProps(a: {value: 10}), attr: 'a'})
      expect(prop).to.be.instanceof properties.Number

    describe "units", ->
      it "should default to rad units", ->
        prop = new properties.Angle({obj: new SomeHasProps(a: {value: 10}), attr: 'a'})
        expect(prop.spec.units).to.be.equal "rad"

      it "should accept deg units", ->
        prop = new properties.Angle({obj: new SomeHasProps(a: {value: 10, units:"deg"}), attr: 'a'})
        expect(prop.spec.units).to.be.equal "deg"

      it "should accept rad units", ->
        prop = new properties.Angle({obj: new SomeHasProps(a: {value: 10, units:"rad"}), attr: 'a'})
        expect(prop.spec.units).to.be.equal "rad"

      it "should throw an Error on bad units", ->
        fn = ->
          prop = new properties.Angle({obj: new SomeHasProps(a: {value: 10, units:"bad"}), attr: 'a'})
        expect(fn).to.throw Error, "Angle units must be one of deg,rad, given invalid value: bad"

    describe "transform", ->
      it "should multiply radians by -1", ->
        prop = new properties.Angle({obj: new SomeHasProps(a: {value: 10, units: "rad"}), attr: 'a'})
        expect(prop.transform([-10, 0, 10, 20])).to.be.deep.equal [10, -0, -10, -20]

      it "should convert degrees to -1 * radians", ->
        prop = new properties.Angle({obj: new SomeHasProps(a: {value: 10, units: "deg"}), attr: 'a'})
        expect(prop.transform([-180, 0, 180])).to.be.deep.equal [Math.PI, -0, -Math.PI]

  describe "Array", ->
    prop = new properties.Array({obj: new SomeHasProps(a: {field: "foo"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on array input", ->
        expect(prop.validate []).to.equal undefined
        expect(prop.validate [1,2,3]).to.equal undefined
        expect(prop.validate new Float64Array [1,2,3]).to.equal undefined

      it "should throw an Error on non-array input", ->
        validation_error prop, true
        validation_error prop, 10
        validation_error prop, 10.2
        validation_error prop, "foo"
        validation_error prop, {}
        validation_error prop, null
        validation_error prop, undefined

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "Bool", ->
    prop = new properties.Bool({obj: new SomeHasProps(a: {value: true}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->

      it "should return undefined on bool input", ->
        expect(prop.validate true).to.equal undefined
        expect(prop.validate false).to.equal undefined

      it "should throw an Error on non-boolean input", ->
        validation_error prop, 10
        validation_error prop, 10.2
        validation_error prop, "foo"
        validation_error prop, {}
        validation_error prop, []
        validation_error prop, null
        validation_error prop, undefined

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "Color", ->
    prop = new properties.Color({obj: new SomeHasProps(a: {value: "#aabbccdd"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->

      good_tuples = ["rgb(255, 0, 0)",
                     "rgba(200, 0, 0, 0.5)",
                     "rgba(0, 255, 0, 0)",
                     "rgba(0, 0, 255, 1)"
      ]

      bad_tuples = ["rgb(254.5, 0, 0)",
                    "rgba(245.5, 0, 0, 0.5)",
                    "rgba(255.0, 0, 0, 0.5)",
                    "rgba(2550, 0, 0, 0.5)",
                    "rgba(255, 0, 0, 5)",
                    "rgb(255, 0, 0, 0)",
                    "rgba(255, 0, 0, 0.5, 0)",
                    "rgb( )",
                    "rgb(a, b, c)"
      ]

      it "should return undefined on RGBa input", ->
        expect(prop.validate "#aabbccdd").to.equal undefined

      it "should return undefined on integer rgb and rgba tuples", ->
        for good_tuple in good_tuples
          expect(prop.validate good_tuple).to.equal undefined

      it "should throw Error on rgb and rgba tuples with bad numerical values", ->
        for bad_tuple in bad_tuples
          expect(prop.validate, bad_tuple).to.throw Error

      it "should return undefined on svg color input", ->
        for color in svg_colors
          expect(prop.validate color).to.equal undefined

      it "should throw an Error on other input", ->
        validation_error prop, true
        validation_error prop, 10
        validation_error prop, 10.2
        validation_error prop, "foo"
        validation_error prop, {}
        validation_error prop, []
        validation_error prop, null
        validation_error prop, undefined

  describe "Coord", ->
    prop = new properties.Coord({obj: new SomeHasProps(a: {value: "foo"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on numeric or string input", ->
        expect(prop.validate 10).to.equal undefined
        expect(prop.validate 10.2).to.equal undefined
        expect(prop.validate "foo").to.equal undefined

      it "should throw an Error on non-numeric or non-string input", ->
        validation_error prop, true
        validation_error prop, {}
        validation_error prop, []
        validation_error prop, null
        validation_error prop, undefined

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "Direction", ->
    prop = new properties.Direction({obj: new SomeHasProps(a: {value: "clock"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on direction input", ->
        expect(prop.validate "clock").to.equal undefined
        expect(prop.validate "anticlock").to.equal undefined

      it "should throw an Error on other input", ->
        enum_validation_errors prop

    describe "transform", ->
      it "should convert 'clock' to false", ->
        result = prop.transform ["clock"]
        expect(result).to.be.deep.equal new Uint8Array [0]

      it "should convert 'anticlock' to true", ->
        result = prop.transform ["anticlock"]
        expect(result).to.be.deep.equal new Uint8Array [1]

      it "should return a Uint8Array", ->
        result = prop.transform ["clock", "anticlock"]
        expect(result).to.be.deep.equal new Uint8Array [0, 1]

  describe "Distance", ->

    it "should be an instance of Number", ->
      prop = new properties.Distance({obj: new SomeHasProps(a: {value: 10}), attr: 'a'})
      expect(prop).to.be.instanceof properties.Number

    describe "units", ->
      it "should default to data units", ->
        prop = new properties.Distance({obj: new SomeHasProps(a: {value: 10}), attr: 'a'})
        expect(prop.spec.units).to.be.equal "data"

      it "should accept screen units", ->
        prop = new properties.Distance({obj: new SomeHasProps(a: {value: 10, units:"screen"}), attr: 'a'})
        expect(prop.spec.units).to.be.equal "screen"

      it "should accept data units", ->
        prop = new properties.Distance({obj: new SomeHasProps(a: {value: 10, units:"data"}), attr: 'a'})
        expect(prop.spec.units).to.be.equal "data"

      it "should throw an Error on bad units", ->
        fn = ->
          prop = new properties.Distance({obj: new SomeHasProps(a: {value: 10, units:"bad"}), attr: 'a'})
        expect(fn).to.throw Error, "Distance units must be one of screen,data, given invalid value: bad"

    describe "transform", ->
      it "should be Property.transform", ->
        prop = new properties.Distance({obj: new SomeHasProps(a: {value: 10}), attr: 'a'})
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "FontStyle", ->
    prop = new properties.FontStyle({obj: new SomeHasProps(a: {value: "normal"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on font style input", ->
        for x in enums.FontStyle
          expect(prop.validate x).to.equal undefined

      it "should throw an Error on other input", ->
        enum_validation_errors prop

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "LineCap", ->
    prop = new properties.LineCap({obj: new SomeHasProps(a: {value: "butt"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on line cap input", ->
        for x in enums.LineCap
          expect(prop.validate x).to.equal undefined

      it "should throw an Error on other input", ->
        enum_validation_errors prop

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "LineJoin", ->
    prop = new properties.LineJoin({obj: new SomeHasProps(a: {value: "miter"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on line join input", ->
        for x in enums.LineJoin
          expect(prop.validate x).to.equal undefined

      it "should throw an Error on other input", ->
        validation_error prop, true
        validation_error prop, 10
        validation_error prop, 10.2
        validation_error prop, "foo"
        validation_error prop, {}
        validation_error prop, []
        validation_error prop, null
        validation_error prop, undefined

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "Number", ->
    prop = new properties.Number({obj: new SomeHasProps(a: {value: 10}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on numeric input", ->
        expect(prop.validate 10).to.equal undefined
        expect(prop.validate 10.2).to.equal undefined

      it "should throw an Error on non-numeric input", ->
        validation_error prop, true
        validation_error prop, "foo"
        validation_error prop, {}
        validation_error prop, []
        validation_error prop, null
        validation_error prop, undefined

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "String", ->
    prop = new properties.String({obj: new SomeHasProps(a: {value: "foo"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on bool input", ->
        expect(prop.validate "").to.equal undefined
        expect(prop.validate "foo").to.equal undefined

      it "should throw an Error on non-string input", ->
        validation_error prop, true
        validation_error prop, 10
        validation_error prop, 10.2
        validation_error prop, {}
        validation_error prop, []
        validation_error prop, null
        validation_error prop, undefined

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "TextAlign", ->
    prop = new properties.TextAlign({obj: new SomeHasProps(a: {value: "left"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on text align input", ->
        for x in enums.TextAlign
          expect(prop.validate x).to.equal undefined

      it "should throw an Error on other input", ->
        enum_validation_errors prop

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "TextBaseline", ->
    prop = new properties.TextBaseline({obj: new SomeHasProps(a: {value: "top"}), attr: 'a'})

    it "should be an instance of Property", ->
      expect(prop).to.be.instanceof properties.Property

    describe "validate", ->
      it "should return undefined on text baseline input", ->
        for x in enums.TextBaseline
          expect(prop.validate x).to.equal undefined

      it "should throw an Error on other input", ->
        enum_validation_errors prop

    describe "transform", ->
      it "should be Property.transform", ->
        expect(prop.transform).to.be.equal properties.Property.prototype.transform

  describe "exports", ->

    it "should have the Property base class", ->
      expect("Property" of properties).to.be.true

    it "should have Property class helper functions", ->
      expect("simple_prop" of properties).to.be.true
      expect("enum_prop" of properties).to.be.true
      expect("units_prop" of properties).to.be.true

    it "should have concrete property subclasses", ->
      expect("Angle" of properties).to.be.true
      expect("Array" of properties).to.be.true
      expect("Bool" of properties).to.be.true
      expect("Color" of properties).to.be.true
      expect("Coord" of properties).to.be.true
      expect("Direction" of properties).to.be.true
      expect("Distance" of properties).to.be.true
      expect("FontStyle" of properties).to.be.true
      expect("LineCap" of properties).to.be.true
      expect("LineJoin" of properties).to.be.true
      expect("Number" of properties).to.be.true
      expect("String" of properties).to.be.true
      expect("TextAlign" of properties).to.be.true
      expect("TextBaseline" of properties).to.be.true
