import {mount, unmount} from "svelte"

import {configure_hmr, install_framework_test} from "../../shared"
import App from "./App.svelte"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("svelte", ({model, mountOptions, onMounted, onError}) => {
  const component = mount(App, {target: container, props: {model, mountOptions, onMounted, onError}})
  return {
    target: () => container.querySelector(".bokeh-target"),
    unmount: () => unmount(component),
  }
})

configure_hmr(import.meta.hot)
