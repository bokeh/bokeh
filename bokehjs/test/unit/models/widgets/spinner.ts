import {Spinner} from "@bokehjs/models/widgets"
import {display} from "../../_util"
import {expect} from "assertions"
import {delay} from "@bokehjs/core/util/defer"

async function mousedown_mouseup(element: Element): Promise<void> {
  const ev = new MouseEvent("mousedown")
  const ev2 = new MouseEvent("mouseup")
  element.dispatchEvent(ev)
  await delay(10)
  element.dispatchEvent(ev2)
}

describe("Spinner incrementing and decrementing", () => {

  it("should allow Spinner display with initial value", async () => {
    const obj = new Spinner({value: 1.36, step: 1, mode: "float", format: "0.00"})
    const {view}=await display(obj, [500, 400])
    const init_value=view.shadow_el.querySelector(".bk-input") as HTMLInputElement

    expect(init_value.value).to.be.equal("1.36")
  })

  it("value should be correct after incrementing with step", async () => {
    const obj = new Spinner({value: 1.36, step: 1, mode: "float", format: "0.00"})
    const {view} = await display(obj, [500, 400])
    const button = view.shadow_el.querySelector(".bk-spin-btn-up")!
    const input = view.shadow_el.querySelector(".bk-input") as HTMLInputElement

    expect(input.value).to.be.equal("1.36")

    await mousedown_mouseup(button)
    expect(input.value).to.be.equal("2.36")
  })

  it("value should be correct after decrementing with step", async () => {
    const obj = new Spinner({value: 1.36, step: 1, mode: "float", format: "0.00"})
    const {view} = await display(obj, [500, 400])
    const button = view.shadow_el.querySelector(".bk-spin-btn-down")!
    const input = view.shadow_el.querySelector(".bk-input") as HTMLInputElement

    expect(input.value).to.be.equal("1.36")

    await mousedown_mouseup(button)
    expect(input.value).to.be.equal("0.36")
  })

  it("value should be correct after incrementing and decrementing with step", async () => {
    const obj = new Spinner({value: 1.36, step: 1, mode: "float", format: "0.00"})
    const {view} = await display(obj, [500, 400])

    const increment_button = view.shadow_el.querySelector(".bk-spin-btn-up")!
    const decrement_button = view.shadow_el.querySelector(".bk-spin-btn-down")!
    const input = view.shadow_el.querySelector(".bk-input") as HTMLInputElement

    expect(input.value).to.be.equal("1.36")

    await mousedown_mouseup(increment_button)
    expect(input.value).to.be.equal("2.36")

    await mousedown_mouseup(decrement_button)
    expect(input.value).to.be.equal("1.36")
  })

  it("values should be correct when step precision is higher than value's precision", async () => {
    const obj = new Spinner({value: 2.36, step: 1.364, mode: "float", format: "0.000"})
    const {view} = await display(obj, [500, 400])

    const increment_button = view.shadow_el.querySelector(".bk-spin-btn-up")!
    const decrement_button = view.shadow_el.querySelector(".bk-spin-btn-down")!
    const input = view.shadow_el.querySelector(".bk-input") as HTMLInputElement

    expect(input.value).to.be.equal("2.360")

    await mousedown_mouseup(increment_button)
    expect(input.value).to.be.equal("3.724")

    await mousedown_mouseup(increment_button)
    expect(input.value).to.be.equal("5.088")

    await mousedown_mouseup(decrement_button)
    expect(input.value).to.be.equal("3.724")
  })

  it("values should not exceed high and low values", async () => {
    const obj = new Spinner({value: 2.36, step: 1, high: 5, low: 0.5, mode: "float", format: "0.00"})
    const {view} = await display(obj, [500, 400])

    const increment_button = view.shadow_el.querySelector(".bk-spin-btn-up")!
    const decrement_button = view.shadow_el.querySelector(".bk-spin-btn-down")!
    const input = view.shadow_el.querySelector(".bk-input") as HTMLInputElement

    expect(input.value).to.be.equal("2.36")

    await mousedown_mouseup(increment_button)
    expect(input.value).to.be.equal("3.36")

    await mousedown_mouseup(increment_button)
    expect(input.value).to.be.equal("4.36")

    await mousedown_mouseup(increment_button)
    expect(input.value).to.be.equal("4.36")

    await mousedown_mouseup(increment_button)
    expect(input.value).to.be.equal("4.36")

    await mousedown_mouseup(decrement_button)
    expect(input.value).to.be.equal("3.36")

    await mousedown_mouseup(decrement_button)
    expect(input.value).to.be.equal("2.36")

    await mousedown_mouseup(decrement_button)
    expect(input.value).to.be.equal("1.36")

    await mousedown_mouseup(decrement_button)
    expect(input.value).to.be.equal("1.36")
  })
})
