{expect} = require "chai"

{CategoricalColorMapper} = require("models/mappers/categorical_color_mapper")

describe "CategoricalColorMapper module", ->

  describe "CategoricalColorMapper.v_compute method", ->

    describe "with 1-level data factors", ->

      it "should map factors to palette with default start/end", ->
        palette = ["red", "green", "blue"]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: ["a", "b", "c"]
        })
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["blue", "green", "red", "green"])

      it "should map data unknown data to nan_color value", ->
        palette = ["red", "green", "blue"]
        cm = new CategoricalColorMapper({
          palette: palette
          nan_color: "gray"
          factors: ["a", "b", "c"]
        })
        vals = cm.v_compute(["d", "a", "b"])
        expect(vals).to.be.deep.equal(["gray", "red", "green"])

      it "should map data with short palette to nan_color value", ->
        palette = ["red", "green"]
        cm = new CategoricalColorMapper({
          palette: palette
          nan_color: "gray"
          factors: ["a", "b", "c"]
        })
        vals = cm.v_compute(["a", "b", "c"])
        expect(vals).to.be.deep.equal(["red", "green", "gray"])

      it "should disregard any start or end values", ->
        palette = ["red", "green", "blue"]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: ["a", "b", "c"]
        })

        cm.start = 1
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["blue", "green", "red", "green"])

        cm.start = null
        cm.end = 2
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["blue", "green", "red", "green"])

        cm.start = 1
        cm.end = 2
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["blue", "green", "red", "green"])

  describe "with 2-level data factors", ->

    describe "and 1-level palette factors", ->

      it "should map factors to palette with start=0, end=1", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: (x.slice(0,1)[0] for x in factors)
          end: 1
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      it "should map factors to palette with start=1, end=2", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: (x.slice(1,2)[0] for x in factors)
          start: 1
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      for i in [0..1]
        for j in [(i+1)..2]

          # skip the combination that works
          if i==0 and j==1 or i==1 and j==2
            continue

          it "should map everything to nan_color with start=#{i}, end=#{j}", ->
            palette = ["red", "green", "blue", "orange"]
            factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

            cm = new CategoricalColorMapper({
              palette: palette
              factors: (x.slice(0,1)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["gray"])

            cm = new CategoricalColorMapper({
              palette: palette
              factors: (x.slice(1,2)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["gray"])

    describe "and 2-level palette factors", ->

      it "should map factors to palette with default start/end", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: factors
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      it "should map factors to palette with start=0, end=2", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: factors
          start: 0
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      for i in [0..1]
        for j in [(i+1)..2]

          # skip the combination that works
          if i==0 and j==2
            continue

          it "should map everything to nan_color with start=#{i}, end=#{j}", ->
            palette = ["red", "green", "blue", "orange"]
            factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

            cm = new CategoricalColorMapper({
              palette: palette
              factors: factors
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["gray"])

  describe "with 3-level data factors", ->

    describe "and 1-level palette factors", ->

      it "should map factors to palette with start=0, end=1", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1", "foo"], ["d", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: (x.slice(0,1)[0] for x in factors)
          end: 1
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      it "should map factors to palette with start=1, end=2", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "3", "baz"], ["c", "4", "bar"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: (x.slice(1,2)[0] for x in factors)
          start: 1
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      it "should map factors to palette with start=2, end=3", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1", "foo"], ["a", "2", "quux"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: (x.slice(2,3)[0] for x in factors)
          start: 2
          end: 3
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      for i in [0..2]
        for j in [(i+1)..3]

          # skip the combination that works
          if i==0 and j==1 or i==1 and j==2 or i==2 and j==3
            continue

          it "should map everything to nan_color with start=#{i}, end=#{j}", ->
            palette = ["red", "green", "blue", "orange"]
            factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

            cm = new CategoricalColorMapper({
              palette: palette
              factors: (x.slice(0,1)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["gray"])

            cm = new CategoricalColorMapper({
              palette: palette
              factors: (x.slice(1,2)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["gray"])

            cm = new CategoricalColorMapper({
              palette: palette
              factors: (x.slice(2,3)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["gray"])

    describe "and 2-level palette factors", ->

      it "should map factors to palette with start=0, end=2", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: (x.slice(0,2) for x in factors)
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      it "should map factors to palette with start=1, end=3", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: (x.slice(1,3) for x in factors)
          start: 1
          end: 3
        })

        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      for i in [0..2]
        for j in [(i+1)..3]

          # skip the combination that works
          if i==0 and j==2 or i==1 and j==3
            continue

          it "should map everything to nan_color with start=#{i}, end=#{j}", ->
            palette = ["red", "green", "blue", "orange"]
            factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

            cm = new CategoricalColorMapper({
              palette: palette
              factors: (x.slice(0,2) for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute(["a"])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["gray"])

            cm = new CategoricalColorMapper({
              palette: palette
              factors: (x.slice(1,3) for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute(["a"])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["gray"])

    describe "and 3-level palette factors", ->

      it "should map factors to palette with default start/end", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: factors
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      it "should map factors to palette with start=0, end=3", ->
        palette = ["red", "green", "blue", "orange"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        cm = new CategoricalColorMapper({
          palette: palette
          factors: factors
          start: 0
          end: 3
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(palette)

      for i in [0..2]
        for j in [(i+1)..3]

          # skip the combination that works
          if i==0 and j==3
            continue

          it "should map everything to nan_color with start=#{i}, end=#{j}", ->
            palette = ["red", "green", "blue", "orange"]
            factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
            cm = new CategoricalColorMapper({
              palette: palette
              factors: factors
            })

            cm.start = i
            cm.end = j

            vals = cm.v_compute(["a"])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["gray"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["gray"])
