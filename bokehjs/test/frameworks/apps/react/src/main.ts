import {StrictMode, createElement} from "react"
import {createRoot} from "react-dom/client"

import {Bokeh, BokehDocument, BokehRoot} from "@bokeh/react"

import {configure_hmr, install_framework_test, mark_hmr_received} from "../../shared"
import type {FrameworkRenderRequest} from "../../shared"
import {generation} from "./hmr_state"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("react", ({model, mountOptions, onMounted, onError}) => {
  const root = createRoot(container)
  const render = ({model, mountOptions, onMounted, onError}: FrameworkRenderRequest) => {
    const content = Array.isArray(model)
      ? createElement(BokehDocument, {models: model, mountOptions, onMounted, onError},
        createElement("section", null, createElement(BokehRoot, {model: model[0], className: "bokeh-target"})),
        createElement("p", null, "ordinary React content between roots"),
        createElement("aside", null, createElement(BokehRoot, {model: model[1], className: "bokeh-target"})),
      )
      : createElement(Bokeh, {model, mountOptions, onMounted, onError, className: "bokeh-target"})
    root.render(createElement(StrictMode, null, content))
  }
  render({model, mountOptions, onMounted, onError})
  return {
    target: () => container.querySelector(".bokeh-target"),
    update: render,
    unmount: () => root.unmount(),
  }
})

configure_hmr(import.meta.hot)
void generation
import.meta.hot?.accept("./hmr_state", mark_hmr_received)
