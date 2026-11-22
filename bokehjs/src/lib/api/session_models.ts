import {register_all_models} from "../all/register"
import {default_resolver} from "../base"
import {ModelResolver} from "../core/resolvers"

/** Prepare server document decoding without replacing application registrations. */
export function register_builtin_models(): boolean {
  const builtins = new ModelResolver(null)
  register_all_models(builtins)
  for (const name of builtins.names) {
    if (default_resolver.get(name) == null) {
      default_resolver.register(builtins.get(name)!)
    }
  }
  return true
}
