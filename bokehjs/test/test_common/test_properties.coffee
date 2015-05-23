{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/object"

base = utils.require "common/base"
{Collections} = base
Properties = utils.require "common/properties"
svg_colors = utils.require "common/svg_colors"

describe "properties module", ->
  before ->
    fixtures.Collection.reset()
    base.collection_overrides['TestObject'] = fixtures.Collection
  after ->
    base.collection_overrides['TestObject'] = undefined

  generate_obj = (attrs) ->
    Collections('TestObject').create(attrs)

  generate_source = () ->
    Collections('ColumnDataSource').create({data: {foo: [10, 20]}})

  fixed = {a: 1}
  spec_field = {a: {field: 'foo'}, b: 30}
  spec_value = {a: {value: 2}}

  describe "Property", ->

    it "should thrown an Error for malformed specs", ->
      fn = ->
        new Properties.Property({obj: generate_obj({a: {}}), attr: 'a'})
      expect(fn).to.throw Error

    it "should thrown an Error for spec fields that are not strings", ->
      fn = ->
        new Properties.Property({obj: generate_obj({a: {field: 10}}), attr: 'a'})
      expect(fn).to.throw Error


    describe "value", ->
      it "should return a fixed value if there is one on the object", ->
        prop = new Properties.Property({obj: generate_obj(fixed), attr: 'a'})
        expect(prop.value()).to.be.equal 1

      it "should return a fixed value if there is a value spec", ->
        prop = new Properties.Property({obj: generate_obj(spec_value), attr: 'a'})
        expect(prop.value()).to.be.equal 2

      it "should return NaN otherwise", ->
        prop = new Properties.Property({obj: generate_obj(fixed), attr: 'b'})
        expect(prop.value()).to.be.NaN

    describe "array", ->
      it "should return an array from the source if there a field spec", ->
        prop = new Properties.Property({obj: generate_obj(spec_field), attr: 'a'})
        source = generate_source()
        expect(prop.array(source)).to.deep.equal [10, 20]

      it "should broadcast fixed values", ->
        prop = new Properties.Property({obj: generate_obj(spec_field), attr: 'b'})
        source = generate_source()
        expect(prop.array(source)).to.deep.equal [30, 30]

      it "should broadcast fixed values, including NaNs", ->
        prop = new Properties.Property({obj: generate_obj(spec_field), attr: 'c'})
        source = generate_source()
        expect(prop.array(source)).to.deep.equal [NaN, NaN]

    describe "default transform", ->
      it "should be the identity", ->
        prop = new Properties.Property({obj: generate_obj(fixed), attr: 'a'})
        expect(prop.transform(10)).to.be.equal 10
        expect(prop.transform("foo")).to.be.equal "foo"
        expect(prop.transform([1,2,3])).to.be.deep.equal [1,2,3]
        expect(prop.transform(null)).to.be.null

    describe "default validate", ->
      it "should return null", ->
        prop = new Properties.Property({obj: generate_obj(fixed), attr: 'a'})
        expect(prop.validate()).to.be.true
        expect(prop.validate(10)).to.be.true
        expect(prop.validate("foo")).to.be.true
        expect(prop.validate(null)).to.be.true


  describe "Numeric", ->

    it "should be an instance of Property", ->
      expect(Properties.Numeric.prototype).to.be.instanceof Properties.Property

    describe "validate", ->
      it "should return true on numeric input", ->
        expect(Properties.Numeric.prototype.validate 10).to.be.true

      it "should throw an error on non-numeric input", ->
        fn = ->
          Properties.Numeric.prototype.validate "foo"
        expect(fn).to.throw Error
        fn = ->
          Properties.Numeric.prototype.validate {}
        expect(fn).to.throw Error
        fn = ->
          Properties.Numeric.prototype.validate []
        expect(fn).to.throw Error
        fn = ->
          Properties.Numeric.prototype.validate null
        expect(fn).to.throw Error

    describe "transform", ->
      it "should return a Float64Array", ->
        result = Properties.Numeric.prototype.transform [10, 20, 30]
        expect(result).to.be.deep.equal new Float64Array [10, 20, 30]


  describe "Angle", ->

    it "should be an instance of Numeric", ->
      expect(Properties.Angle.prototype).to.be.instanceof Properties.Numeric

    it "should prefer to set units from a spec if possible", ->
      prop = new Properties.Angle({obj: generate_obj({a: {value: 1, units: "deg"}, a_units: "rad"}), attr: 'a'})
      expect(prop.units).to.be.equal "deg"

    it "should otherwise set units from the object if possible", ->
      prop = new Properties.Angle({obj: generate_obj({a: 1, a_units: "deg"}), attr: 'a'})
      expect(prop.units).to.be.equal "deg"

    it "should set units to 'rad' as a default", ->
      prop = new Properties.Angle({obj: generate_obj({a: 1}), attr: 'a'})
      expect(prop.units).to.be.equal "rad"

    it "should throw an error on bad units", ->
      fn = ->
        new Properties.Angle({obj: generate_obj({a: {value: 1, units: "foo"}}), attr: 'a'})
      expect(fn).to.throw Error

    describe "transform", ->

      it "should convert degrees to radians and flip sign", ->
        prop = new Properties.Angle({obj: generate_obj({a: 1, a_units: "deg"}), attr: 'a'})
        expect(prop.transform [1, 2, 3]).to.be.deep.equal new Float64Array [-Math.PI/180.0, -2*Math.PI/180.0, -3*Math.PI/180.0]

      it "should pass radians with sign flipped", ->
        prop = new Properties.Angle({obj: generate_obj({a: 1, a_units: "rad"}), attr: 'a'})
        expect(prop.transform [1, 2, 3]).to.be.deep.equal new Float64Array [-1, -2, -3]


  describe "Distance", ->

    it "should be an instance of Numeric", ->
      expect(Properties.Distance.prototype).to.be.instanceof Properties.Numeric

    it "should prefer to set units from a spec if possible", ->
      prop = new Properties.Distance({obj: generate_obj({a: {value: 1, units: "screen"}, a_units: "data"}), attr: 'a'})
      expect(prop.units).to.be.equal "screen"

    it "should otherwise set units from the object if possible", ->
      prop = new Properties.Distance({obj: generate_obj({a: 1, a_units: "data"}), attr: 'a'})
      expect(prop.units).to.be.equal "data"

    it "should set units to 'data' as a default", ->
      prop = new Properties.Distance({obj: generate_obj({a: 1}), attr: 'a'})
      expect(prop.units).to.be.equal "data"

    it "should throw an error on bad units", ->
      fn = ->
        new Properties.Distance({obj: generate_obj({a: {value: 1, units: "foo"}}), attr: 'a'})
      expect(fn).to.throw Error


  describe "Array", ->

    it "should be an instance of Property", ->
      expect(Properties.Array.prototype).to.be.instanceof Properties.Property

    describe "validate", ->
      it "should return true on array input", ->
        expect(Properties.Array.prototype.validate [10]).to.be.true

      it "should throw an error on non-array input", ->
        fn = ->
          Properties.Array.prototype.validate "foo"
        expect(fn).to.throw Error
        fn = ->
          Properties.Array.prototype.validate {}
        expect(fn).to.throw Error
        fn = ->
          Properties.Array.prototype.validate 10
        expect(fn).to.throw Error
        fn = ->
          Properties.Bool.prototype.validate null
        expect(fn).to.throw Error


  describe "Bool", ->

    it "should be an instance of Property", ->
      expect(Properties.Bool.prototype).to.be.instanceof Properties.Property

    describe "validate", ->
      it "should return true on bool input", ->
        expect(Properties.Bool.prototype.validate true).to.be.true
        expect(Properties.Bool.prototype.validate false).to.be.true

      it "should throw an error on non-bool input", ->
        fn = ->
          Properties.Bool.prototype.validate "foo"
        expect(fn).to.throw Error
        fn = ->
          Properties.Bool.prototype.validate {}
        expect(fn).to.throw Error
        fn = ->
          Properties.Bool.prototype.validate 10
        expect(fn).to.throw Error
        fn = ->
          Properties.Bool.prototype.validate []
        expect(fn).to.throw Error
        fn = ->
          Properties.Bool.prototype.validate null
        expect(fn).to.throw Error


  describe "Coord", ->

    it "should be an instance of Property", ->
      expect(Properties.Coord.prototype).to.be.instanceof Properties.Property

    describe "validate", ->
      it "should return true on numeric input", ->
        expect(Properties.Coord.prototype.validate 10).to.be.true
        expect(Properties.Coord.prototype.validate 10.2).to.be.true

      it "should return true on string input", ->
        expect(Properties.Coord.prototype.validate "foo").to.be.true

      it "should throw an error on other input", ->
        fn = ->
          Properties.Coord.prototype.validate {}
        expect(fn).to.throw Error
        fn = ->
          Properties.Coord.prototype.validate true
        expect(fn).to.throw Error
        fn = ->
          Properties.Coord.prototype.validate []
        expect(fn).to.throw Error
        fn = ->
          Properties.Coord.prototype.validate null
        expect(fn).to.throw Error

  describe "Color", ->

    it "should be an instance of Property", ->
      expect(Properties.Color.prototype).to.be.instanceof Properties.Property

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

      it "should return true on RGBa input", ->
        expect(Properties.Color.prototype.validate "#aabbccdd").to.be.true

      it "should return true on integer rgb and rgba tuples", ->
        for good_tuple in good_tuples
          expect(Properties.Color.prototype.validate good_tuple).to.be.true

      it "should throw error on rgb and rgba tuples with bad numerical values", ->
        for bad_tuple in bad_tuples
          expect(Properties.Color.prototype.validate, bad_tuple).to.throw Error

      it "should return true on svg color input", ->
        for color in svg_colors
          expect(Properties.Color.prototype.validate color).to.be.true

      it "should throw an error on other input", ->
        fn = ->
          Properties.Color.prototype.validate "foo"
        expect(fn).to.throw Error
        fn = ->
          Properties.Color.prototype.validate {}
        expect(fn).to.throw Error
        fn = ->
          Properties.Color.prototype.validate true
        expect(fn).to.throw Error
        fn = ->
          Properties.Color.prototype.validate []
        expect(fn).to.throw Error
        fn = ->
          Properties.Color.prototype.validate null
        expect(fn).to.throw Error


  describe "String", ->

    it "should be an instance of Property", ->
      expect(Properties.String.prototype).to.be.instanceof Properties.Property

    describe "validate", ->
      it "should return true on string input", ->
        expect(Properties.String.prototype.validate "foo").to.be.true

      it "should throw an error on other input", ->
        fn = ->
          Properties.String.prototype.validate {}
        expect(fn).to.throw Error
        fn = ->
          Properties.String.prototype.validate true
        expect(fn).to.throw Error
        fn = ->
          Properties.String.prototype.validate []
        expect(fn).to.throw Error
        fn = ->
          Properties.String.prototype.validate null
        expect(fn).to.throw Error


  describe "Enum", ->

    it "should be an instance of Property", ->
      expect(Properties.Enum.prototype).to.be.instanceof Properties.Property

    describe "validate", ->
      it "should return true on levels input", ->
        q = new Properties.Enum({obj: generate_obj({a: "foo"}), attr: 'a', values:"foo bar"})
        expect(q.validate "foo").to.be.true
        expect(q.validate "bar").to.be.true

      it "should throw an error on other input", ->
        fn = ->
          Properties.Enum.prototype.validate "quux"
        expect(fn).to.throw Error
        fn = ->
          Properties.Enum.prototype.validate {}
        expect(fn).to.throw Error
        fn = ->
          Properties.Enum.prototype.validate true
        expect(fn).to.throw Error
        fn = ->
          Properties.Enum.prototype.validate []
        expect(fn).to.throw Error
        fn = ->
          Properties.Enum.prototype.validate null
        expect(fn).to.throw Error

  describe "Direction", ->
    it "should be an instance of Enum", ->
      expect(Properties.Direction.prototype).to.be.instanceof Properties.Enum

    it "should should have direction levels", ->
      q = new Properties.Direction({obj: generate_obj({a: "clock"}), attr: 'a'})
      expect(q.levels).to.be.deep.equal ['anticlock', 'clock']

    describe "transform", ->
      it "should convert 'clock' to false", ->
        result = Properties.Direction.prototype.transform ["clock"]
        expect(result).to.be.deep.equal new Uint8Array [0]

      it "should convert 'anticlock' to true", ->
        result = Properties.Direction.prototype.transform ["anticlock"]
        expect(result).to.be.deep.equal new Uint8Array [1]

      it "should return a Uint8Array", ->
        result = Properties.Direction.prototype.transform ["clock", "anticlock"]
        expect(result).to.be.deep.equal new Uint8Array [0, 1]



  describe "exports", ->

    it "should have basic properties", ->
      expect("Angle" of Properties).to.be.true
      expect("Array" of Properties).to.be.true
      expect("Bool" of Properties).to.be.true
      expect("Color" of Properties).to.be.true
      expect("Coord" of Properties).to.be.true
      expect("Direction" of Properties).to.be.true
      expect("Distance" of Properties).to.be.true
      expect("Enum" of Properties).to.be.true
      expect("Numeric" of Properties).to.be.true
      expect("Property" of Properties).to.be.true
      expect("String" of Properties).to.be.true

    it "should have context properties", ->
      expect("Line" of Properties).to.be.true
      expect("Fill" of Properties).to.be.true
      expect("Text" of Properties).to.be.true

    it "should have property factories", ->
      expect("coords" of Properties.factories).to.be.true
      expect("distances" of Properties.factories).to.be.true
      expect("angles" of Properties.factories).to.be.true
      expect("fields" of Properties.factories).to.be.true
      expect("visuals" of Properties.factories).to.be.true
