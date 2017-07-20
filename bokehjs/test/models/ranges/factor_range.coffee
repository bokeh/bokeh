{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{CustomJS} = utils.require("models/callbacks/customjs")
{FactorRange} = utils.require("models/ranges/factor_range")

describe "factor_range module", ->

  describe "default creation", ->
    r = new FactorRange()

    it "should have empty factors", ->
      expect(r.factors).to.be.deep.equal []

    it "should have start=0", ->
      expect(r.start).to.be.equal 0

  describe "reset method", ->

    it "should execute callback once", ->
      cb = new CustomJS()
      spy = sinon.spy(cb, 'execute')

      r = new FactorRange({callback: cb})

      expect(spy.called).to.be.false
      r.reset()
      # expect(spy.calledOnce).to.be.true

  describe "changing model attribute", ->

    it "should execute callback once", ->
      cb = new CustomJS()
      spy = sinon.spy(cb, 'execute')

      r = new FactorRange({callback: cb})

      expect(spy.called).to.be.false
      r.factors = ["A", "B", "C"]
      # expect(spy.calledOnce).to.be.true






  describe "simple list of factors", ->

    describe "validation", ->

      it "should throw an error on duplicate factors", ->
        expect(() -> new FactorRange({factors: ['a', 'a']})).to.throw(Error)

      it "should throw an error on null factors", ->
        expect(() -> new FactorRange({factors: [null]})).to.throw(Error)
        expect(() -> new FactorRange({factors: ['a', null]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [null, 'a']})).to.throw(Error)

    describe "levels property", ->

      it "should be set to 1", ->
        r = new FactorRange({factors: ['A', 'B', 'C', 'D']})
        expect(r.levels).to.be.equal 1

    describe "min/max properties", ->
      r = new FactorRange({factors: ['FOO'], range_padding: 0})

      it "should return values from synthetic range", ->

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 1

      it "should update when factors update", ->
        r.factors = ['FOO', 'BAR']

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 2

        r.factors = ['A', 'B', 'C']

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 3

      it "min should equal start", ->
        expect(r.min).to.be.equal r.start

      it "max should equal end", ->
        expect(r.max).to.be.equal r.end

    describe "start/end properties", ->
      r = new FactorRange({factors: ['FOO'], range_padding: 0})

      it "should return values from synthetic range", ->

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 1

      it "should update when factors update", ->
        r.factors = ['FOO', 'BAR']

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 2

        r.factors = ['A', 'B', 'C']

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3

    describe "range_padding", ->

      it "should pad start/end by 10 percent by default", ->
        r = new FactorRange({factors: ['A', 'B', 'C', 'D']}) # default range padding

        expect(r.start).to.be.equal -0.2
        expect(r.end).to.be.equal 4.2

      it "should update start/end when changed", ->
        r = new FactorRange({factors: ['A', 'B', 'C', 'D']}) # default range padding
        expect(r.start).to.be.equal -0.2
        expect(r.end).to.be.equal 4.2

        r.range_padding = 0.2
        expect(r.start).to.be.equal -0.4
        expect(r.end).to.be.equal 4.4

      it "should update start/end when factors changed", ->
        r = new FactorRange({factors: ['A', 'B']}) # default range padding
        expect(r.start).to.be.equal -0.1
        expect(r.end).to.be.equal 2.1

        r.factors = ['A']
        expect(r.start).to.be.equal -0.05
        expect(r.end).to.be.equal 1.05

      it "should accept absolute units", ->
        r = new FactorRange({factors: ['A', 'B', 'C', 'D'], range_padding_units: "absolute", range_padding: 1})

        expect(r.start).to.be.equal -1
        expect(r.end).to.be.equal 5

    describe "factor_padding", ->

      it "should pad all factors", ->
        r = new FactorRange({factors: ['A', 'B', 'C'], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.2
        expect(r.v_synthetic(['A', 'B', 'C'])).to.deep.equal [0.5, 1.6, 2.7]

      it "should update range when changed", ->
        r = new FactorRange({factors: ['A', 'B', 'C'], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.2
        expect(r.v_synthetic(['A', 'B', 'C'])).to.deep.equal [0.5, 1.6, 2.7]

        r.factor_padding = 0.2
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.4
        expect(r.v_synthetic(['A', 'B', 'C'])).to.deep.equal [0.5, 1.7, 2.9]

      it "should update start/end when factors changed", ->
        r = new FactorRange({factors: ['A', 'B'], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 2.1
        expect(r.v_synthetic(['A', 'B'])).to.deep.equal [0.5, 1.6]

        r.factors = ['A', 'B', 'C']
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.2
        expect(r.v_synthetic(['A', 'B', 'C'])).to.deep.equal [0.5, 1.6, 2.7]

    describe "synthetic method", ->
      r = new FactorRange({factors: ['A', 'B', 'C']})

      it "should return numeric offsets as-is", ->
        expect(r.synthetic(10)).to.equal 10
        expect(r.synthetic(10.2)).to.equal 10.2
        expect(r.synthetic(-5.7)).to.equal -5.7
        expect(r.synthetic(-5)).to.equal -5

      it "should map simple factors to synthetic coords", ->
        expect(r.synthetic("A")).to.equal 0.5
        expect(r.synthetic("B")).to.equal 1.5
        expect(r.synthetic("C")).to.equal 2.5

      it "should map simple factors with offsets to synthetic coords", ->
        expect(r.synthetic(["A", 0.1])).to.equal 0.6
        expect(r.synthetic(["B", -0.2])).to.equal 1.3
        expect(r.synthetic(["C"])).to.equal 2.5

      it "should not modify inputs", ->
        x = ["B", -0.2]
        r.synthetic(x)
        expect(x).to.deep.equal ["B", -0.2]

    describe "v_synthetic method", ->
      r = new FactorRange({factors: ['A', 'B', 'C']})

      it "should return an Array", ->
        x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.be.instanceof(Array)
        x = r.v_synthetic(["A", "B", "C", "A"])
        expect(x).to.be.instanceof(Array)
        x = r.v_synthetic([])
        expect(x).to.be.instanceof(Array)

      it "should return lists of numeric offsets as-is", ->
        x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.deep.equal [10, 10.2, -5.7, -5]

      it "should map simple factors to synthetic coords", ->
        expect(r.v_synthetic(["A", "B", "C", "A"])).to.deep.equal [0.5, 1.5, 2.5, 0.5]

      it "should map simple factors with offsets to synthetic coords", ->
        expect(r.v_synthetic([["A", 0.1], ["B", -0.2], ["C"], ["A", 0]])).to.deep.equal [0.6, 1.3, 2.5, 0.5]

      it "should not modify inputs", ->
        x = [["A", 0.1], ["B", -0.2]]
        r.v_synthetic(x)
        expect(x).to.deep.equal [["A", 0.1], ["B", -0.2]]






  describe "tuple list of double factors", ->

    describe "validation", ->

      it "should throw an error on duplicate factors", ->
        expect(() -> new FactorRange({factors: [['a', '1'], ['a', '1']]})).to.throw(Error)

      it "should throw an error on null factors", ->
        expect(() -> new FactorRange({factors: [[null, 'a'], ['b', 'c']]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [['a', null], ['b', 'c']]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [[null, null], ['b', 'c']]})).to.throw(Error)

      it "should allow sub-factors repeated on different levels", ->
        expect(() -> new FactorRange({factors: [['a', 'foo'], ['a', 'bar']]})).to.not.throw(Error)
        expect(() -> new FactorRange({factors: [['a', 'foo'], ['b', 'foo']]})).to.not.throw(Error)

    describe "levels property", ->

      it "should be set to 2", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']]})
        expect(r.levels).to.be.equal 2

    describe "min/max properties", ->
      r = new FactorRange({factors: [['FOO', 'a']], range_padding: 0})

      it "should return values from synthetic range", ->

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 1

      it "should update when factors update", ->
        r.factors = [['FOO', 'a'], ['BAR', 'b']]

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 2

        r.factors = [['A', '1'], ['A', '2'], ['C', '1']]

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 3

      it "min should equal start", ->
        expect(r.min).to.be.equal r.start

      it "max should equal end", ->
        expect(r.max).to.be.equal r.end

    describe "start/end properties", ->
      r = new FactorRange({factors: [['FOO', 'a']], range_padding: 0})

      it "should return values from synthetic range", ->

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 1

      it "should update when factors update", ->
        r.factors = [['FOO', 'a'], ['BAR', 'b']]

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 2

        r.factors = [['A', '1'], ['A', '2'], ['C', '1']]

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3

    describe "range_padding", ->

      it "should pad start/end by 10 percent by default", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']]}) # default range padding

        expect(r.start).to.be.equal -0.2
        expect(r.end).to.be.equal 4.2

      it "should update start/end when changed", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']]}) # default range padding
        expect(r.start).to.be.equal -0.2
        expect(r.end).to.be.equal 4.2

        r.range_padding = 0.2
        expect(r.start).to.be.equal -0.4
        expect(r.end).to.be.equal 4.4

      it "should update start/end when factors changed", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2']]}) # default range padding
        expect(r.start).to.be.equal -0.1
        expect(r.end).to.be.equal 2.1

        r.factors = ['A']
        expect(r.start).to.be.equal -0.05
        expect(r.end).to.be.equal 1.05

      it "should accept absolute units", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']], range_padding_units: "absolute", range_padding: 1})

        expect(r.start).to.be.equal -1
        expect(r.end).to.be.equal 5

    describe "factor_padding", ->

      it "should pad all top-level factors", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.1
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.deep.equal [0.5, 1.5, 2.6]

      it "should update range when changed", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.1
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.deep.equal [0.5, 1.5, 2.6]

        r.factor_padding = 0.2
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.2
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.deep.equal [0.5, 1.5, 2.7]

      it "should update start/end when factors changed", ->
        r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.1
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.deep.equal [0.5, 1.5, 2.6]

        r.factors = [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']]
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 4.2
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']])).to.deep.equal [0.5, 1.5, 2.6, 3.7]

    describe "synthetic method", ->
      r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']]})

      it "should return numeric offsets as-is", ->
        expect(r.synthetic(10)).to.equal 10
        expect(r.synthetic(10.2)).to.equal 10.2
        expect(r.synthetic(-5.7)).to.equal -5.7
        expect(r.synthetic(-5)).to.equal -5

      it "should map dual factors to synthetic coords", ->
        expect(r.synthetic(['A', '1'])).to.equal 0.5
        expect(r.synthetic(['A', '2'])).to.equal 1.5
        expect(r.synthetic(['C', '1'])).to.equal 2.5

      it "should map dual factors with offsets to synthetic coords", ->
        expect(r.synthetic(['A', '1', 0.1])).to.equal 0.6
        expect(r.synthetic(['A', '2', -0.2])).to.equal 1.3
        expect(r.synthetic(['C', '1', 0.0])).to.equal 2.5

      it "should map first-level factors to average group synthetic coords", ->
        expect(r.synthetic(['A'])).to.equal 1
        expect(r.synthetic(['C'])).to.equal 2.5

        expect(r.synthetic('A')).to.equal 1
        expect(r.synthetic('C')).to.equal 2.5

      it "should map first-level factors with offsets to average group synthetic coords", ->
        expect(r.synthetic(['A', 0.1])).to.equal 1.1
        expect(r.synthetic(['C', -0.2])).to.equal 2.3
        expect(r.synthetic(['C', 0.0])).to.equal 2.5

      it "should not modify inputs", ->
        x = ['A', '1', 0.1]
        r.synthetic(x)
        expect(x).to.deep.equal ['A', '1', 0.1]

    describe "v_synthetic method", ->
      r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']]})

      it "should return an Array", ->
        x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.be.instanceof(Array)
        x = r.v_synthetic(["A", "C", "A"])
        expect(x).to.be.instanceof(Array)
        x = r.v_synthetic([])
        expect(x).to.be.instanceof(Array)

      it "should return lists of numeric offsets as-is", ->
        x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.deep.equal [10, 10.2, -5.7, -5]

      it "should map dual factors to synthetic coords", ->
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.deep.equal [0.5, 1.5, 2.5]

      it "should map dual factors with offsets to synthetic coords", ->
        expect(r.v_synthetic([['A', '1', 0.1], ['A', '2', -0.2], ['C', '1', 0]])).to.deep.equal [0.6, 1.3, 2.5]

      it "should map first-level factors to average group synthetic coords", ->
        expect(r.v_synthetic([['A'], ['C']])).to.deep.equal [1, 2.5]

        expect(r.v_synthetic(['A', 'C'])).to.deep.equal [1, 2.5]

      it "should map first-level factors with offsets to average group synthetic coords", ->
        expect(r.v_synthetic([['A', 0.1], ['C', -0.2], ['C', 0]])).to.deep.equal [1.1, 2.3, 2.5]

      it "should not modify inputs", ->
        x = ['A', '1', 0.1]
        r.v_synthetic([x])
        expect(x).to.deep.equal ['A', '1', 0.1]





  describe "tuple list of triple factors", ->

    describe "validation", ->

      it "should throw an error on duplicate factors", ->
        expect(() -> new FactorRange({factors: [['a', '1', 'foo'], ['a', '1', 'foo']]})).to.throw(Error)

      it "should throw an error on null factors", ->
        expect(() -> new FactorRange({factors: [['foo', null, null]]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [[null, 'foo', null]]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [[null, null, 'a']]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [['a', 'foo', null]]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [['foo', null, 'a']]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [[null, 'foo', 'a']]})).to.throw(Error)
        expect(() -> new FactorRange({factors: [[null, null, null]]})).to.throw(Error)

      it "should allow sub-factors repeated on different levels", ->
        expect(() -> new FactorRange({factors: [['a', 'foo', '1'], ['a', 'bar', '1']]})).to.not.throw(Error)
        expect(() -> new FactorRange({factors: [['a', 'foo', '1'], ['a', 'foo', '2']]})).to.not.throw(Error)
        expect(() -> new FactorRange({factors: [['a', 'foo', '1'], ['b', 'foo', '1']]})).to.not.throw(Error)

    describe "levels property", ->

      it "should be set to 3", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'bar'], ['C', '1', 'baz']]})
        expect(r.levels).to.be.equal 3

    describe "min/max properties", ->
      r = new FactorRange({factors: [['FOO', 'a', '1']], range_padding: 0})

      it "should return values from synthetic range", ->

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 1

      it "should update when factors update", ->
        r.factors = [['FOO', 'a', '1'], ['BAR', 'b', '2']]

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 2

        r.factors = [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']]

        expect(r.min).to.be.equal 0
        expect(r.max).to.be.equal 3

      it "min should equal start", ->
        expect(r.min).to.be.equal r.start

      it "max should equal end", ->
        expect(r.max).to.be.equal r.end

    describe "start/end properties", ->
      r = new FactorRange({factors: [['FOO', 'a', 'foo']], range_padding: 0})

      it "should return values from synthetic range", ->

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 1

      it "should update when factors update", ->
        r.factors = [['FOO', 'a', '1'], ['BAR', 'b', '2']]

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 2

        r.factors = [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']]

        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3

    describe "range_padding", ->

      it "should pad start/end by 10 percent by default", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']]}) # default range padding

        expect(r.start).to.be.equal -0.2
        expect(r.end).to.be.equal 4.2

      it "should update start/end when changed", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']]}) # default range padding
        expect(r.start).to.be.equal -0.2
        expect(r.end).to.be.equal 4.2

        r.range_padding = 0.2
        expect(r.start).to.be.equal -0.4
        expect(r.end).to.be.equal 4.4

      it "should update start/end when factors changed", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo']]}) # default range padding
        expect(r.start).to.be.equal -0.1
        expect(r.end).to.be.equal 2.1

        r.factors = ['A']
        expect(r.start).to.be.equal -0.05
        expect(r.end).to.be.equal 1.05

      it "should accept absolute units", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']], range_padding_units: "absolute", range_padding: 1})

        expect(r.start).to.be.equal -1
        expect(r.end).to.be.equal 5

    describe "factor_padding", ->

      it "should pad all top-level factors", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.1
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.deep.equal [0.5, 1.5, 2.6]

      it "should update range when changed", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.1
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.deep.equal [0.5, 1.5, 2.6]

        r.factor_padding = 0.2
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.2
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.deep.equal [0.5, 1.5, 2.7]

      it "should update start/end when factors changed", ->
        r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], range_padding: 0, factor_padding: 0.1})
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 3.1
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.deep.equal [0.5, 1.5, 2.6]

        r.factors = [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']]
        expect(r.start).to.be.equal 0
        expect(r.end).to.be.equal 4.2
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']])).to.deep.equal [0.5, 1.5, 2.6, 3.7]

    describe "synthetic method", ->
      r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']]})

      it "should return numeric offsets as-is", ->
        expect(r.synthetic(10)).to.equal 10
        expect(r.synthetic(10.2)).to.equal 10.2
        expect(r.synthetic(-5.7)).to.equal -5.7
        expect(r.synthetic(-5)).to.equal -5

      it "should map triple factors to synthetic coords", ->
        expect(r.synthetic(['A', '1', 'foo'])).to.equal 0.5
        expect(r.synthetic(['A', '1', 'bar'])).to.equal 1.5
        expect(r.synthetic(['C', '1', 'foo'])).to.equal 2.5

      it "should map triple factors with offsets to synthetic coords", ->
        expect(r.synthetic(['A', '1', 'foo', 0.1])).to.equal 0.6
        expect(r.synthetic(['A', '1', 'bar', -0.2])).to.equal 1.3
        expect(r.synthetic(['C', '1', 'foo', 0.0])).to.equal 2.5

      it "should map first-level factors to average group synthetic coords", ->
        expect(r.synthetic(['A'])).to.equal 1
        expect(r.synthetic(['C'])).to.equal 2.5

        expect(r.synthetic('A')).to.equal 1
        expect(r.synthetic('C')).to.equal 2.5

      it "should map first-level factors with offsets to average group synthetic coords", ->
        expect(r.synthetic(['A', 0.1])).to.equal 1.1
        expect(r.synthetic(['C', -0.2])).to.equal 2.3
        expect(r.synthetic(['C', 0.0])).to.equal 2.5

      it "should map second-level factors to average group synthetic coords", ->
        expect(r.synthetic(['A', '1'])).to.deep.equal 1

      it "should map second-level factors with offsets to average group synthetic coords", ->
        expect(r.synthetic(['A', '1', 0.1])).to.deep.equal 1.1

      it "should not modify inputs", ->
        x = ['A', '1', 'foo', 0.1]
        r.synthetic(x)
        expect(x).to.deep.equal ['A', '1', 'foo', 0.1]

    describe "v_synthetic method", ->
      r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']]})

      it "should return an Array", ->
        x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.be.instanceof(Array)
        x = r.v_synthetic(["A", "C", "A"])
        expect(x).to.be.instanceof(Array)
        x = r.v_synthetic([])
        expect(x).to.be.instanceof(Array)

      it "should return lists of numeric offsets as-is", ->
        x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.deep.equal [10, 10.2, -5.7, -5]

      it "should map triple factors to synthetic coords", ->
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']])).to.deep.equal [0.5, 1.5, 2.5]

      it "should map triple factors with offsets to synthetic coords", ->
        expect(r.v_synthetic([['A', '1', 'foo', 0.1], ['A', '1', 'bar', -0.2], ['C', '1', 'foo', 0]])).to.deep.equal [0.6, 1.3, 2.5]

      it "should map first-level factors to average group synthetic coords", ->
        expect(r.v_synthetic([['A'], ['C']])).to.deep.equal [1, 2.5]

        expect(r.v_synthetic(['A', 'C'])).to.deep.equal [1, 2.5]

      it "should map first-level factors with offsets to average group synthetic coords", ->
        expect(r.v_synthetic([['A', 0.1], ['C', -0.2], ['C', 0]])).to.deep.equal [1.1, 2.3, 2.5]

      it "should map second-level factors to average group synthetic coords", ->
        expect(r.v_synthetic([['A', '1']])).to.deep.equal [1]

      it "should map second-level factors with offsets to average group synthetic coords", ->
        expect(r.v_synthetic([['A', '1', 0.1]])).to.deep.equal [1.1]

      it "should not modify inputs", ->
        x = ['A', '1', 'foo', 0.1]
        r.v_synthetic([x])
        expect(x).to.deep.equal ['A', '1', 'foo', 0.1]
