import {Spinner} from "@bokehjs/models/widgets"
import {display} from "../../_util"
import {expect} from "assertions"
import {delay} from "@bokehjs/core/util/defer"

async function mouseup_mousedown(element: Element): Promise<void> {
  const ev = new MouseEvent("mousedown")
  const ev2 = new MouseEvent("mouseup")
  element.dispatchEvent(ev)
  await delay(10)
  element.dispatchEvent(ev2)
}
it.allowing(8)("should allow Spinner display with initial value", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv}=await display(obj, [500, 400])
  const init_value=sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(init_value.value).to.be.equal("1.36")

})

it.allowing(8)("value should be correct after incrementing with step", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv} = await display(obj, [500, 400])
  const button = sv.shadow_el.querySelector(".bk-spin-btn-up")!
  const input = sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(input.value).to.be.equal("1.36")

  await mouseup_mousedown(button)
  expect(input.value).to.be.equal("2.36")

})

it.allowing(8)("value should be correct after decrementing with step", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv} = await display(obj, [500, 400])
  const button = sv.shadow_el.querySelector(".bk-spin-btn-down")!
  const input = sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(input.value).to.be.equal("1.36")

  await mouseup_mousedown(button)
  expect(input.value).to.be.equal("2.36")
})

it.allowing(8)("value should be correct after incrementing and decrementing with step", async () => {
  const obj = new Spinner({value: 1.36, step: 1, mode: "float"})
  const {view: sv} = await display(obj, [500, 400])

  const increment_button = sv.shadow_el.querySelector(".bk-spin-btn-up")!
  const decrement_button = sv.shadow_el.querySelector(".bk-spin-btn-down")!
  const input = sv.shadow_el.querySelector(".bk-input") as HTMLInputElement

  expect(input.value).to.be.equal("1.36")

  await mouseup_mousedown(increment_button)
  expect(input.value).to.be.equal("2.36")

  await mouseup_mousedown(decrement_button)
  expect(input.value).to.be.equal("1.36")

})
