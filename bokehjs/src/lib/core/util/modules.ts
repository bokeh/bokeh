function is_ModuleError(error: unknown): error is Error & {code: string} {
  return error instanceof Error && "code" in error
}

/** T is of import("some/module/path") type */
export async function load_module<T>(module: Promise<T>): Promise<T | null> {
  try {
    return await module
  } catch (e) {
    // XXX: this exposes the underlying module system and hinders
    // interoperability with other module systems and bundlers
    if (is_ModuleError(e) && e.code === "MODULE_NOT_FOUND")
      return null
    else
      throw e
  }
}
