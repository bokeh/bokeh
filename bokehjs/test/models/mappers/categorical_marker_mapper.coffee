{expect} = require "chai"

{CategoricalMarkerMapper} = require("models/mappers/categorical_marker_mapper")

describe "CategoricalMarkerMapper module", ->

  describe "CategoricalMarkerMapper.v_compute method", ->

    describe "with 1-level data factors", ->

      it "should map factors to markers with default start/end", ->
        markers = ["hex", "circle", "dash"]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: ["a", "b", "c"]
        })
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["dash", "circle", "hex", "circle"])

      it "should map data unknown data to default_value value", ->
        markers = ["hex", "circle", "dash"]
        cm = new CategoricalMarkerMapper({
          markers: markers
          default_value: "circle"
          factors: ["a", "b", "c"]
        })
        vals = cm.v_compute(["d", "a", "b"])
        expect(vals).to.be.deep.equal(["circle", "hex", "circle"])

      it "should map data with short markers to default_value value", ->
        markers = ["hex", "circle"]
        cm = new CategoricalMarkerMapper({
          markers: markers
          default_value: "circle"
          factors: ["a", "b", "c"]
        })
        vals = cm.v_compute(["a", "b", "c"])
        expect(vals).to.be.deep.equal(["hex", "circle", "circle"])

      it "should disregard any start or end values", ->
        markers = ["hex", "circle", "dash"]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: ["a", "b", "c"]
        })

        cm.start = 1
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["dash", "circle", "hex", "circle"])

        cm.start = null
        cm.end = 2
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["dash", "circle", "hex", "circle"])

        cm.start = 1
        cm.end = 2
        vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.deep.equal(["dash", "circle", "hex", "circle"])

  describe "with 2-level data factors", ->

    describe "and 1-level markers factors", ->

      it "should map factors to markers with start=0, end=1", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: (x.slice(0,1)[0] for x in factors)
          end: 1
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      it "should map factors to markers with start=1, end=2", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: (x.slice(1,2)[0] for x in factors)
          start: 1
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      for i in [0..1]
        for j in [(i+1)..2]

          # skip the combination that works
          if i==0 and j==1 or i==1 and j==2
            continue

          it "should map everything to default_value with start=#{i}, end=#{j}", ->
            markers = ["hex", "circle", "dash", "square"]
            factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: (x.slice(0,1)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["circle"])

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: (x.slice(1,2)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["circle"])

    describe "and 2-level markers factors", ->

      it "should map factors to markers with default start/end", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: factors
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      it "should map factors to markers with start=0, end=2", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: factors
          start: 0
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      for i in [0..1]
        for j in [(i+1)..2]

          # skip the combination that works
          if i==0 and j==2
            continue

          it "should map everything to default_value with start=#{i}, end=#{j}", ->
            markers = ["hex", "circle", "dash", "square"]
            factors = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: factors
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["circle"])

  describe "with 3-level data factors", ->

    describe "and 1-level markers factors", ->

      it "should map factors to markers with start=0, end=1", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1", "foo"], ["d", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: (x.slice(0,1)[0] for x in factors)
          end: 1
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      it "should map factors to markers with start=1, end=2", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "3", "baz"], ["c", "4", "bar"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: (x.slice(1,2)[0] for x in factors)
          start: 1
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      it "should map factors to markers with start=2, end=3", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1", "foo"], ["a", "2", "quux"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: (x.slice(2,3)[0] for x in factors)
          start: 2
          end: 3
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      for i in [0..2]
        for j in [(i+1)..3]

          # skip the combination that works
          if i==0 and j==1 or i==1 and j==2 or i==2 and j==3
            continue

          it "should map everything to default_value with start=#{i}, end=#{j}", ->
            markers = ["hex", "circle", "dash", "square"]
            factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: (x.slice(0,1)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["circle"])

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: (x.slice(1,2)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["circle"])

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: (x.slice(2,3)[0] for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["circle"])

    describe "and 2-level markers factors", ->

      it "should map factors to markers with start=0, end=2", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: (x.slice(0,2) for x in factors)
          end: 2
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      it "should map factors to markers with start=1, end=3", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: (x.slice(1,3) for x in factors)
          start: 1
          end: 3
        })

        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      for i in [0..2]
        for j in [(i+1)..3]

          # skip the combination that works
          if i==0 and j==2 or i==1 and j==3
            continue

          it "should map everything to default_value with start=#{i}, end=#{j}", ->
            markers = ["hex", "circle", "dash", "square"]
            factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: (x.slice(0,2) for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute(["a"])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["circle"])

            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: (x.slice(1,3) for x in factors)
              start: i
              end: j
            })

            vals = cm.v_compute(["a"])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["circle"])

    describe "and 3-level markers factors", ->

      it "should map factors to markers with default start/end", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: factors
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      it "should map factors to markers with start=0, end=3", ->
        markers = ["hex", "circle", "dash", "square"]
        factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        cm = new CategoricalMarkerMapper({
          markers: markers
          factors: factors
          start: 0
          end: 3
        })
        vals = cm.v_compute(factors)
        expect(vals).to.be.deep.equal(markers)

      for i in [0..2]
        for j in [(i+1)..3]

          # skip the combination that works
          if i==0 and j==3
            continue

          it "should map everything to default_value with start=#{i}, end=#{j}", ->
            markers = ["hex", "circle", "dash", "square"]
            factors = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
            cm = new CategoricalMarkerMapper({
              markers: markers
              factors: factors
            })

            cm.start = i
            cm.end = j

            vals = cm.v_compute(["a"])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "foo"]])
            expect(vals).to.be.deep.equal(["circle"])

            vals = cm.v_compute([["a", "1", "baz"]])
            expect(vals).to.be.deep.equal(["circle"])
