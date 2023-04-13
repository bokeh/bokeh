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

it("should allow Spinner display with initial value", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv}=await display(obj, [500, 400])
  const init_value=sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(init_value.value).to.be.equal("1.36")
})

it("value should be correct after incrementing with step", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv} = await display(obj, [500, 400])
  const button = sv.shadow_el.querySelector(".bk-spin-btn-up")!
  const input = sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(input.value).to.be.equal("1.36")

  await mousedown_mouseup(button)
  expect(input.value).to.be.equal("2.36")
})

it("value should be correct after decrementing with step", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv} = await display(obj, [500, 400])
  const button = sv.shadow_el.querySelector(".bk-spin-btn-down")!
  const input = sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(input.value).to.be.equal("1.36")

  await mousedown_mouseup(button)
  expect(input.value).to.be.equal("0.36")
})

it("value should be correct after incrementing and decrementing with step", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv} = await display(obj, [500, 400])

  const increment_button = sv.shadow_el.querySelector(".bk-spin-btn-up")!
  const decrement_button = sv.shadow_el.querySelector(".bk-spin-btn-down")!
  const input = sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(input.value).to.be.equal("1.36")

  await mousedown_mouseup(increment_button)
  expect(input.value).to.be.equal("2.36")

  await mousedown_mouseup(decrement_button)
  expect(input.value).to.be.equal("1.36")
})

it("values should be correct when step precision is higher than value's precision", async () => {
  const obj = new Spinner({value: 2.36, step: 1.364, mode: "float"})
  const {view: sv} = await display(obj, [500, 400])

  const increment_button = sv.shadow_el.querySelector(".bk-spin-btn-up")!
  const decrement_button = sv.shadow_el.querySelector(".bk-spin-btn-down")!
  const input = sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(input.value).to.be.equal("2.36")

  await mousedown_mouseup(increment_button)
  expect(input.value).to.be.equal("3.724")

  await mousedown_mouseup(increment_button)
  expect(input.value).to.be.equal("5.088")

  await mousedown_mouseup(decrement_button)
  expect(input.value).to.be.equal("3.724")
})
