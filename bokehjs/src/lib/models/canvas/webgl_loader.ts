import {load_module} from "core/util/modules"
import {has_webgl_module} from "./webgl"

/**
 * Loads the WebGL module, unless it's already registered. Resolves to whether
 * WebGL support is available. This is the only asynchronous part of WebGL
 * initialization and should be awaited before building views.
 *
 * This lives in its own module, because the WebGL module imports `./webgl`
 * to register itself, so a dynamic import there would form a cycle.
 */
export async function load_webgl(): Promise<boolean> {
  if (!has_webgl_module()) {
    // registers itself when evaluated
    await load_module(import("../glyphs/webgl"))
  }
  return has_webgl_module()
}
