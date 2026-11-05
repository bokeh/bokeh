import {mount, unmount} from "svelte"

import {install_framework_test} from "../../shared"
import App from "./App.svelte"
import Session from "./Session.svelte"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("svelte", ({model, mountOptions, onMounted, onError}) => {
  const component = mount(App, {
    target: container,
    props: {model, multiRoot: Array.isArray(model), mountOptions, onMounted, onError},
  })
  return {
    target: () => container.querySelector(".bokeh-target"),
    unmount: () => unmount(component),
  }
}, (request) => {
  const component = mount(Session, {target: container, props: request})
  return {
    target: (name) => container.querySelector(`.${name}`),
    showFirst: (value) => component.showFirst(value),
    unmount: () => unmount(component),
  }
})
