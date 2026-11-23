import {expect} from "#framework/assertions"

import {DragSession} from "@bokehjs/core/drag_session"

describe("core/drag_session module", () => {
  describe("DragSession", () => {
    function setup() {
      const restored: number[] = []
      const session = new DragSession<"area" | "edge", number>((snapshot) => restored.push(snapshot))
      return {session, restored}
    }

    it("should keep track of the dragged target and its snapshot", () => {
      const {session} = setup()
      expect(session.is_active).to.be.false
      expect(session.target).to.be.null
      expect(() => session.state).to.throw()

      session.start("edge", 10)
      expect(session.is_active).to.be.true
      expect(session.target).to.be.equal("edge")
      expect(session.state).to.be.equal({target: "edge", snapshot: 10})
    })

    it("should not allow starting a drag while dragging", () => {
      const {session} = setup()
      session.start("area", 10)
      expect(() => session.start("edge", 20)).to.throw()
    })

    it("should keep the effects of a drag when ending it", () => {
      const {session, restored} = setup()
      session.start("area", 10)
      session.end()
      expect(session.is_active).to.be.false
      expect(restored).to.be.equal([])
    })

    it("should restore the snapshot when cancelling a drag", () => {
      const {session, restored} = setup()
      session.start("area", 10)
      session.cancel()
      expect(session.is_active).to.be.false
      expect(restored).to.be.equal([10])

      // nothing to cancel
      session.cancel()
      expect(restored).to.be.equal([10])
    })

    it("should allow starting a new drag after the previous one finished", () => {
      const {session} = setup()
      session.start("area", 10)
      session.cancel()
      session.start("edge", 20)
      expect(session.state).to.be.equal({target: "edge", snapshot: 20})
    })
  })
})
