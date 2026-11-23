import * as sinon from "sinon"

import {expect} from "#framework/assertions"

import {div, MouseButton} from "@bokehjs/core/dom"
import type {GestureHandlers, Options, PanEvent, TapEvent} from "@bokehjs/core/ui_gestures"
import {UIGestures} from "@bokehjs/core/ui_gestures"

describe("core/ui_gestures module", () => {
  describe("UIGestures", () => {
    const pointer_id = 1 // the mouse pointer, which is always active

    function pointer(type: string, x: number, y: number): PointerEvent {
      return new PointerEvent(type, {
        bubbles: true,
        composed: true,
        cancelable: true,
        isPrimary: true,
        pointerType: "mouse",
        pointerId: pointer_id,
        buttons: type == "pointerdown" ? MouseButton.Left : 0,
        clientX: x,
        clientY: y,
      })
    }

    function escape(): KeyboardEvent {
      const event = new KeyboardEvent("keydown", {key: "Escape", bubbles: true, cancelable: true})
      document.dispatchEvent(event)
      return event
    }

    type Events = (PanEvent | TapEvent)["type"][]

    type Handlers = {cancellable: boolean, can_cancel_pan?: () => boolean}

    function setup(handlers: Handlers, options: Options = {}) {
      const events: Events = []
      const pans: PanEvent[] = []
      const record_pan = (event: PanEvent) => {
        events.push(event.type)
        pans.push(event)
      }
      const record_tap = (event: TapEvent) => events.push(event.type)

      const gesture_handlers: GestureHandlers = {
        on_tap: record_tap,
        on_pan_start: record_pan,
        on_pan: record_pan,
        on_pan_end: record_pan,
        ...(handlers.cancellable ? {on_pan_cancel: record_pan} : {}),
        ...(handlers.can_cancel_pan != null ? {can_cancel_pan: handlers.can_cancel_pan} : {}),
      }

      const child_el = div()
      const hit_area = div(child_el)
      document.body.append(hit_area)

      const gestures = new UIGestures(hit_area, gesture_handlers, options)
      gestures.connect_signals()

      const cleanup = () => {
        gestures.remove()
        hit_area.remove()
      }

      return {events, pans, hit_area, child_el, gestures, cleanup}
    }

    async function with_setup(handlers: Handlers, options: Options, fn: (env: ReturnType<typeof setup>) => void): Promise<void> {
      const env = setup(handlers, options)
      try {
        fn(env)
      } finally {
        env.cleanup()
      }
    }

    function pan_start(el: Element): void {
      el.dispatchEvent(pointer("pointerdown", 10, 10))
      el.dispatchEvent(pointer("pointermove", 20, 10)) // beyond move_threshold
    }

    it("should report pan_start, pan and pan_end", async () => {
      await with_setup({cancellable: true}, {}, ({events, pans, hit_area}) => {
        pan_start(hit_area)
        hit_area.dispatchEvent(pointer("pointermove", 30, 15))
        hit_area.dispatchEvent(pointer("pointerup", 30, 15))

        expect(events).to.be.equal(["pan_start", "pan", "pan", "pan_end"])
        expect(pans.map(({dx, dy}) => [dx, dy])).to.be.equal([[0, 0], [10, 0], [20, 5], [20, 5]])
      })
    })

    it("should cancel panning on Escape when on_pan_cancel is provided", async () => {
      await with_setup({cancellable: true}, {}, ({events, pans, hit_area}) => {
        pan_start(hit_area)
        hit_area.dispatchEvent(pointer("pointermove", 30, 15))

        const ev = escape()
        expect(ev.defaultPrevented).to.be.true
        expect(events).to.be.equal(["pan_start", "pan", "pan", "pan_cancel"])
        const {type, dx, dy} = pans[pans.length - 1]
        expect({type, dx, dy}).to.be.equal({type: "pan_cancel", dx: 20, dy: 5})

        // the rest of the cancelled gesture is ignored
        hit_area.dispatchEvent(pointer("pointermove", 40, 20))
        hit_area.dispatchEvent(pointer("pointerup", 40, 20))
        expect(events).to.be.equal(["pan_start", "pan", "pan", "pan_cancel"])
      })
    })

    it("should recognize new gestures after a cancelled one", async () => {
      await with_setup({cancellable: true}, {}, ({events, hit_area}) => {
        pan_start(hit_area)
        escape()
        hit_area.dispatchEvent(pointer("pointerup", 20, 10))
        events.length = 0

        pan_start(hit_area)
        hit_area.dispatchEvent(pointer("pointerup", 20, 10))
        expect(events).to.be.equal(["pan_start", "pan", "pan_end"])
      })
    })

    it("should not cancel panning on Escape when on_pan_cancel isn't provided", async () => {
      await with_setup({cancellable: false}, {}, ({events, hit_area}) => {
        pan_start(hit_area)

        const ev = escape()
        expect(ev.defaultPrevented).to.be.false

        hit_area.dispatchEvent(pointer("pointermove", 30, 10))
        hit_area.dispatchEvent(pointer("pointerup", 30, 10))
        expect(events).to.be.equal(["pan_start", "pan", "pan", "pan_end"])
      })
    })

    it("should not cancel panning on Escape when can_cancel_pan() returns false", async () => {
      let recorded: Events = []
      let observed: Events | null = null
      const can_cancel_pan = () => {
        observed = [...recorded]
        return false
      }
      await with_setup({cancellable: true, can_cancel_pan}, {}, ({events, hit_area}) => {
        recorded = events
        pan_start(hit_area)
        // called after on_pan_start()
        expect(observed).to.be.equal(["pan_start"])

        const ev = escape()
        expect(ev.defaultPrevented).to.be.false

        hit_area.dispatchEvent(pointer("pointerup", 30, 10))
        expect(events).to.be.equal(["pan_start", "pan", "pan_end"])
      })
    })

    it("should cancel panning on Escape when can_cancel_pan() returns true", async () => {
      await with_setup({cancellable: true, can_cancel_pan: () => true}, {}, ({events, hit_area}) => {
        pan_start(hit_area)
        const ev = escape()
        expect(ev.defaultPrevented).to.be.true
        expect(events).to.be.equal(["pan_start", "pan", "pan_cancel"])
      })
    })

    it("should not handle Escape outside of panning", async () => {
      await with_setup({cancellable: true}, {}, ({events, hit_area}) => {
        expect(escape().defaultPrevented).to.be.false

        pan_start(hit_area)
        hit_area.dispatchEvent(pointer("pointerup", 20, 10))
        expect(escape().defaultPrevented).to.be.false

        expect(events).to.be.equal(["pan_start", "pan", "pan_end"])
      })
    })

    it("should stop handling Escape after disconnecting", async () => {
      await with_setup({cancellable: true}, {}, ({events, hit_area, gestures}) => {
        pan_start(hit_area)
        gestures.disconnect_signals()

        expect(escape().defaultPrevented).to.be.false
        expect(events).to.be.equal(["pan_start", "pan"])
      })
    })

    describe("should cancel panning on pointercancel", () => {
      it("and report pan_cancel when on_pan_cancel is provided", async () => {
        await with_setup({cancellable: true}, {}, ({events, hit_area}) => {
          pan_start(hit_area)
          hit_area.dispatchEvent(pointer("pointercancel", 0, 0))
          expect(events).to.be.equal(["pan_start", "pan", "pan_cancel"])
        })
      })

      it("and report pan_end otherwise", async () => {
        await with_setup({cancellable: false}, {}, ({events, pans, hit_area}) => {
          pan_start(hit_area)
          hit_area.dispatchEvent(pointer("pointercancel", 0, 0))
          expect(events).to.be.equal(["pan_start", "pan", "pan_end"])
          // positions of the last known pointer event, not of pointercancel
          const {type, dx, dy} = pans[pans.length - 1]
          expect({type, dx, dy}).to.be.equal({type: "pan_end", dx: 10, dy: 0})
        })
      })
    })

    it("should cancel panning on lostpointercapture", async () => {
      await with_setup({cancellable: true}, {}, ({events, hit_area}) => {
        pan_start(hit_area)
        hit_area.dispatchEvent(pointer("lostpointercapture", 0, 0))
        expect(events).to.be.equal(["pan_start", "pan", "pan_cancel"])

        hit_area.dispatchEvent(pointer("pointerup", 20, 10))
        expect(events).to.be.equal(["pan_start", "pan", "pan_cancel"])
      })
    })

    it("should ignore lostpointercapture after pointerup", async () => {
      await with_setup({cancellable: true}, {}, ({events, hit_area}) => {
        pan_start(hit_area)
        hit_area.dispatchEvent(pointer("pointerup", 20, 10))
        hit_area.dispatchEvent(pointer("lostpointercapture", 20, 10))
        expect(events).to.be.equal(["pan_start", "pan", "pan_end"])
      })
    })

    it("should capture pointers on hit_area by default", async () => {
      await with_setup({cancellable: true}, {}, ({hit_area, child_el}) => {
        const spy = sinon.spy(hit_area, "setPointerCapture")
        child_el.dispatchEvent(pointer("pointerdown", 10, 10))
        expect(spy.calledOnceWith(pointer_id)).to.be.true
        child_el.dispatchEvent(pointer("pointerup", 10, 10))
      })
    })

    it("should support capturing pointers on capture_target", async () => {
      const capture_target = (event: PointerEvent) => event.composedPath()[0] as HTMLElement
      await with_setup({cancellable: true}, {capture_target}, ({events, hit_area, child_el}) => {
        const hit_area_spy = sinon.spy(hit_area, "setPointerCapture")
        const child_spy = sinon.spy(child_el, "setPointerCapture")

        pan_start(child_el)
        expect(hit_area_spy.called).to.be.false
        expect(child_spy.calledOnceWith(pointer_id)).to.be.true

        // a lost capture is observed on the capturing element
        child_el.dispatchEvent(pointer("lostpointercapture", 0, 0))
        expect(events).to.be.equal(["pan_start", "pan", "pan_cancel"])
      })
    })
  })
})
