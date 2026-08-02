import {StrictMode, createElement} from "react"
import {createRoot} from "react-dom/client"

import {Bokeh} from "@bokeh/react"

import {configure_hmr, install_framework_test} from "../../shared"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("react", ({model, mountOptions, onMounted, onError}) => {
  const root = createRoot(container)
  root.render(createElement(StrictMode, null,
    createElement(Bokeh, {model, mountOptions, onMounted, onError, className: "bokeh-target"}),
  ))
  return {
    target: () => container.querySelector(".bokeh-target"),
    unmount: () => root.unmount(),
  }
})

configure_hmr(import.meta.hot)
