{expect} = require "chai"
utils = require "../../utils"

refs = utils.require "core/util/refs"

{HasProps} = utils.require "core/has_props"

class Foo extends HasProps
  type: 'Foo'

describe "refs module", ->

  describe "create_ref", ->
    it "should throw an Error on non-HasProps", ->
      fn = ->
        refs.create_ref(10)
      expect(fn).to.throw Error, "can only create refs for HasProps subclasses"

    it "should return a correct ref for a standard HasProps", ->
      obj = new Foo()
      ref = refs.create_ref(obj)
      expect(ref.id).to.be.equal obj.id
      expect(ref.type).to.be.equal obj.type
      expect(ref.subtype).to.be.undefined
      expect(refs.is_ref(ref)).to.be.true

    it "should return a correct ref for a subtype HasProps", ->
      obj = new Foo()
      obj._subtype = "bar"
      ref = refs.create_ref(obj)
      expect(ref.id).to.be.equal obj.id
      expect(ref.type).to.be.equal obj.type
      expect(ref.subtype).to.be.equal "bar"
      expect(refs.is_ref(ref)).to.be.true

  describe "is_ref", ->
    it "should return true for {id, type}", ->
      obj = {id: 10, type: "foo"}
      expect(refs.is_ref(obj)).to.be.true

    it "should return true for {id, type, subtype}", ->
      obj = {id: 10, type: "foo", subtype: "bar"}
      expect(refs.is_ref(obj)).to.be.true

    it "should return false on any other object", ->
      obj = {}
      expect(refs.is_ref(obj)).to.be.false

      obj = {id: 10}
      expect(refs.is_ref(obj)).to.be.false

      obj = {type: "foo"}
      expect(refs.is_ref(obj)).to.be.false

      obj = {a: 10, type: "foo"}
      expect(refs.is_ref(obj)).to.be.false

      obj = {id: 10, b: "foo"}
      expect(refs.is_ref(obj)).to.be.false

      obj = {subtype: "bar"}
      expect(refs.is_ref(obj)).to.be.false

      obj = {a: 10, b: "foo", c: "bar", d: "baz"}
      expect(refs.is_ref(obj)).to.be.false

    it "should return false on non-objects", ->
      expect(refs.is_ref(10.2)).to.be.false
      expect(refs.is_ref(true)).to.be.false
      expect(refs.is_ref("foo")).to.be.false
      expect(refs.is_ref([])).to.be.false
