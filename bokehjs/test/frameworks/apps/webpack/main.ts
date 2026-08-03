import type {BokehMount} from "@bokeh/bokehjs"
import {defineBokehDocumentElement, defineBokehElement, defineBokehRootElement} from "@bokeh/web-component"
import type {BokehDocumentElement, BokehElement, BokehRootElement} from "@bokeh/web-component"

import {configure_hmr, install_framework_test} from "../shared"

const container = document.querySelector<HTMLElement>("#app")!
const PrimaryElement = defineBokehElement("bokeh-ci-plot")
const SecondaryElement = defineBokehElement("bokeh-ci-secondary")
defineBokehDocumentElement("bokeh-ci-document")
defineBokehRootElement("bokeh-ci-root")
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
  if (Array.isArray(model)) {
    const host = document.createElement("div")
    const provider = document.createElement("bokeh-ci-document") as BokehDocumentElement
    provider.models = model
    provider.mountOptions = mountOptions
    provider.addEventListener("bokeh-mount", (event) => onMounted((event as CustomEvent<BokehMount>).detail), {once: true})
    provider.addEventListener("bokeh-mount-error", (event) => onError((event as CustomEvent<unknown>).detail), {once: true})
    const first = document.createElement("bokeh-ci-root") as BokehRootElement
    first.className = "bokeh-target"
    first.model = model[0]
    first.bokehDocument = provider
    const second = document.createElement("bokeh-ci-root") as BokehRootElement
    second.className = "bokeh-target"
    second.model = model[1]
    second.bokehDocument = provider
    const content = document.createElement("p")
    content.textContent = "ordinary DOM content between roots"
    host.append(provider, first, content, second)
    container.append(host)
    return {
      target: () => first,
      unmount: () => host.remove(),
    }
  }

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
