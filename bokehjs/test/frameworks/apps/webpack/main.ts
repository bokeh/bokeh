import type {BokehMount} from "@bokeh/bokehjs"
import {defineBokehElement} from "@bokeh/web-component"
import type {BokehElement} from "@bokeh/web-component"

import {configure_hmr, install_framework_test} from "../shared"

const container = document.querySelector<HTMLElement>("#app")!
defineBokehElement("bokeh-ci-plot")

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
