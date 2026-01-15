const re = /\.[^/\\]+$/

export function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith(".") && !re.test(specifier)) {
    specifier = `${specifier}.js`
  }
  return defaultResolve(specifier, context)
}
