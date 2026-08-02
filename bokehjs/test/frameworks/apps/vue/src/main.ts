import {createApp, h} from "vue"

import {Bokeh} from "@bokeh/vue"

import {configure_hmr, install_framework_test} from "../../shared"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("vue", ({model, mountOptions, onMounted, onError}) => {
  const app = createApp({
    render: () => h(Bokeh, {model, mountOptions, onMounted, onMountError: onError, class: "bokeh-target"}),
  })
  app.mount(container)
  return {
    target: () => container.querySelector(".bokeh-target"),
    unmount: () => app.unmount(),
  }
})

configure_hmr(import.meta.hot)
