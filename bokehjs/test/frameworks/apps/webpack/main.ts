import type {BokehMount} from "@bokeh/bokehjs"
import {defineBokehElement} from "@bokeh/web-component"
import type {BokehElement} from "@bokeh/web-component"

import {configure_hmr, install_framework_test} from "../shared"

const container = document.querySelector<HTMLElement>("#app")!
const PrimaryElement = defineBokehElement("bokeh-ci-plot")
const SecondaryElement = defineBokehElement("bokeh-ci-secondary")
if (PrimaryElement == SecondaryElement) {
  throw new Error("different custom-element names unexpectedly reused one constructor")
}

if (customElements.get("bokeh-ci-conflict") == null) {
  customElements.define("bokeh-ci-conflict", class extends HTMLElement {})
}
try {
  defineBokehElement("bokeh-ci-conflict")
  throw new Error("an unrelated custom-element definition was silently accepted")
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("already defined")) {
    throw error
  }
}

install_framework_test("web-component-webpack", ({model, mountOptions, onMounted, onError}) => {
  const element = document.createElement("bokeh-ci-plot") as BokehElement
  element.model = model
  element.mountOptions = mountOptions
  element.addEventListener("bokeh-mount", (event) => onMounted((event as CustomEvent<BokehMount>).detail), {once: true})
  element.addEventListener("bokeh-mount-error", (event) => onError((event as CustomEvent<unknown>).detail), {once: true})
  container.append(element)
  return {
    target: () => element,
    unmount: () => element.remove(),
  }
})

configure_hmr(undefined)
