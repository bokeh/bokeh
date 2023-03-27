import {base64_to_buffer} from "core/util/buffer"

import wasm_binary from "wasm/bokeh_web_bg.wasm"
import init_wasm, {type InitOutput as WasmAPI} from "wasm/bokeh_web"

export const not_available = Symbol("not_available")
export type NotAvailable = typeof not_available

export const wasm_lib: () => Promise<WasmAPI | NotAvailable> = (() => {
  let _global_wasm: Promise<WasmAPI | NotAvailable> | undefined
  return () => {
    if (_global_wasm == null) {
      // TODO: load binary *.wasm from a URL
      // TODO: return not_available if wasm is not supported
      const wasm_bytes = base64_to_buffer(wasm_binary)
      _global_wasm = init_wasm(wasm_bytes)
    }
    return _global_wasm
  }
})()
