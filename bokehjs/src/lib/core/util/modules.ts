/** T is of import("some/module/path") type */
export async function load_module<T>(module: Promise<T>): Promise<T | null> {
  try {
    return await module
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") // XXX: this exposes the underyling module system
      return null
    else
      throw e
  }
}
