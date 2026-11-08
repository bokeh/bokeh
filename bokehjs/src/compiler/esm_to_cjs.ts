// ESM -> CJS conversion of individual modules (oxc-parser + eslint-scope + MagicString).
//
// Rewrites only what CJS requires: import/export statements and references to imported
// bindings. Everything else, including names of classes and functions, is left as is.
// Interop with CJS modules and `export *` use tslib's helpers, like tsc's output.
import {parseSync} from "oxc-parser"
import MagicString from "magic-string"
import * as eslint_scope from "eslint-scope"

import {walk} from "./transforms.js"

type Node = {type: string, start: number, end: number, [key: string]: any}

class ConversionError extends Error {}

function bound_names(pattern: Node): string[] {
  switch (pattern.type) {
    case "Identifier": return [pattern.name]
    case "ObjectPattern": return pattern.properties.flatMap((p: Node) => bound_names(p.type == "RestElement" ? p.argument : p.value))
    case "ArrayPattern": return pattern.elements.filter((e: Node | null) => e != null).flatMap((e: Node) => bound_names(e.type == "RestElement" ? e.argument : e))
    case "AssignmentPattern": return bound_names(pattern.left)
    case "RestElement": return bound_names(pattern.argument)
    default: throw new ConversionError(`unsupported pattern ${pattern.type}`)
  }
}

const is_identifier = (name: string) => /^[A-Za-z_$][\w$]*$/.test(name)
const prop = (obj: string, name: string) => is_identifier(name) ? `${obj}.${name}` : `${obj}[${JSON.stringify(name)}]`

type Source = {
  spec: string
  local: string            // generated binding, e.g. `view_js_1`
  default: boolean         // default import or re-export
  named: boolean           // named import or re-export
  namespace: boolean       // `import * as`, `export * as`
  star: boolean            // `export * from`
}

export function to_cjs(file: string, code: string): {code: string, deps: string[]} {
  const {program, errors} = parseSync(file, code, {sourceType: "module", preserveParens: false, range: true})
  if (errors.length != 0) {
    throw new ConversionError(`${file}: ${errors[0].message}`)
  }

  const parents = new Map<Node, Node | null>()
  const used_names = new Set<string>()
  walk(program, (node, parent) => {
    parents.set(node, parent)
    if (node.type == "Identifier") {
      used_names.add(node.name)
    }
  })

  let counter = 0
  function fresh(base: string): string {
    const stem = base.replace(/^.*[\\/]/, "").replace(/[^\w$]/g, "_").replace(/^(\d)/, "_$1")
    for (;;) {
      const name = `${stem}_${++counter}`
      if (!used_names.has(name)) {
        used_names.add(name)
        return name
      }
    }
  }

  const str = new MagicString(code)

  // Module sources, in the order of first appearance (i.e. evaluation order).
  const sources = new Map<string, Source>()
  function source_of(spec: string): Source {
    let source = sources.get(spec)
    if (source == null) {
      source = {spec, local: fresh(spec), default: false, named: false, namespace: false, star: false}
      sources.set(spec, source)
    }
    return source
  }

  // local import binding -> expression
  const imported = new Map<string, string>()
  // export name -> local name (or expression for re-exports)
  const exported = new Map<string, {local: string, reexport: boolean}>()

  // assigned in closures, so not narrowed to `null` by the control flow analysis
  const tslib: {name: string | null} = {name: null}
  const tslib_ref = () => tslib.name ??= fresh("tslib")

  // Import-like statements are evaluated before the module body. Keep requires in place,
  // if they precede all other statements, otherwise hoist them.
  const body: Node[] = program.body
  const is_import_like = (stmt: Node) => stmt.type == "ImportDeclaration" || ((stmt.type == "ExportNamedDeclaration" || stmt.type == "ExportAllDeclaration") && stmt.source != null)
  const first_other = body.findIndex((stmt) => !is_import_like(stmt))
  const hoist = body.some((stmt, i) => is_import_like(stmt) && first_other != -1 && i > first_other)

  const removed: [number, number][] = []
  const pending_requires: {stmt: Node, source: Source}[] = []

  for (const stmt of body) {
    switch (stmt.type) {
      case "ImportDeclaration": {
        if (stmt.importKind == "type") {
          str.remove(stmt.start, stmt.end)
          removed.push([stmt.start, stmt.end])
          break
        }
        const source = source_of(stmt.source.value)
        for (const spec of stmt.specifiers) {
          const local = spec.local.name
          switch (spec.type) {
            case "ImportDefaultSpecifier":
              source.default = true
              imported.set(local, `${source.local}.default`)
              break
            case "ImportNamespaceSpecifier":
              source.namespace = true
              imported.set(local, source.local)
              break
            case "ImportSpecifier": {
              const name = spec.imported.type == "Identifier" ? spec.imported.name : spec.imported.value
              if (name == "default") {
                source.default = true
              } else {
                source.named = true
              }
              imported.set(local, prop(source.local, name))
              break
            }
          }
        }
        pending_requires.push({stmt, source})
        break
      }
      case "ExportAllDeclaration": {
        const source = source_of(stmt.source.value)
        if (stmt.exported != null) {
          source.namespace = true
          const name = stmt.exported.type == "Identifier" ? stmt.exported.name : stmt.exported.value
          exported.set(name, {local: source.local, reexport: true})
        } else {
          source.star = true
        }
        pending_requires.push({stmt, source})
        break
      }
      case "ExportNamedDeclaration": {
        if (stmt.exportKind == "type") {
          str.remove(stmt.start, stmt.end)
          removed.push([stmt.start, stmt.end])
          break
        }
        if (stmt.source != null) {
          const source = source_of(stmt.source.value)
          for (const spec of stmt.specifiers) {
            const name = spec.local.type == "Identifier" ? spec.local.name : spec.local.value
            const as = spec.exported.type == "Identifier" ? spec.exported.name : spec.exported.value
            if (name == "default") {
              source.default = true
            } else {
              source.named = true
            }
            exported.set(as, {local: prop(source.local, name), reexport: true})
          }
          pending_requires.push({stmt, source})
        } else if (stmt.declaration != null) {
          const {declaration} = stmt
          str.remove(stmt.start, declaration.start)
          if (declaration.type == "VariableDeclaration") {
            for (const decl of declaration.declarations) {
              for (const name of bound_names(decl.id)) {
                exported.set(name, {local: name, reexport: false})
              }
            }
          } else {
            exported.set(declaration.id.name, {local: declaration.id.name, reexport: false})
          }
        } else {
          for (const spec of stmt.specifiers) {
            const local = spec.local.name
            const as = spec.exported.type == "Identifier" ? spec.exported.name : spec.exported.value
            exported.set(as, {local, reexport: false})
          }
          str.remove(stmt.start, stmt.end)
          removed.push([stmt.start, stmt.end])
        }
        break
      }
      case "ExportDefaultDeclaration": {
        const {declaration} = stmt
        const named = (declaration.type == "FunctionDeclaration" || declaration.type == "ClassDeclaration") && declaration.id != null
        if (named) {
          str.remove(stmt.start, declaration.start)
          exported.set("default", {local: declaration.id.name, reexport: false})
        } else {
          const local = fresh("default")
          str.overwrite(stmt.start, declaration.start, `const ${local} = `)
          if (declaration.type == "FunctionDeclaration" || declaration.type == "ClassDeclaration") {
            str.appendLeft(declaration.end, ";")
          }
          exported.set("default", {local, reexport: false})
        }
        break
      }
    }
  }

  function require_of(source: Source): string {
    const required = `require(${JSON.stringify(source.spec)})`
    if (source.namespace || (source.default && source.named) || (source.default && source.star)) {
      return `${tslib_ref()}.__importStar(${required})`
    } else if (source.default) {
      return `${tslib_ref()}.__importDefault(${required})`
    } else {
      return required
    }
  }

  // Emit requires: one per source, at its first import-like statement.
  const emitted = new Set<Source>()
  let hoisted = ""
  for (const {stmt, source} of pending_requires) {
    const text = emitted.has(source) ? "" : `const ${source.local} = ${require_of(source)};`
    emitted.add(source)
    const is_side_effect_only = stmt.type == "ImportDeclaration" && stmt.specifiers.length == 0
    const replacement = is_side_effect_only && !source.default && !source.named && !source.namespace && !source.star ? `require(${JSON.stringify(source.spec)});` : text
    if (hoist) {
      hoisted += replacement.length != 0 ? `${replacement}\n` : ""
      str.remove(stmt.start, stmt.end)
    } else if (replacement.length == 0) {
      str.remove(stmt.start, stmt.end)
    } else {
      str.overwrite(stmt.start, stmt.end, replacement)
    }
    removed.push([stmt.start, stmt.end])
  }

  // Rewrite references to imported bindings.
  const scopes = eslint_scope.analyze(program as any, {ecmaVersion: 2025, sourceType: "module"})
  const module_scope = scopes.globalScope!.childScopes.find((scope) => scope.type == "module")!
  const in_removed = (pos: number) => removed.some(([start, end]) => start <= pos && pos < end)

  // Whether `node` is the first token of an expression statement in a statement list, i.e.
  // where a preceding statement without a semicolon would continue into `(`. Elsewhere
  // (e.g. `if (x) f()`) a guarding `;` would become an empty statement and change semantics.
  const statement_lists = new Set(["Program", "BlockStatement", "StaticBlock", "SwitchCase"])
  function starts_statement(node: Node): boolean {
    for (let parent = parents.get(node); parent != null && parent.start == node.start; parent = parents.get(parent)) {
      if (parent.type == "ExpressionStatement") {
        return statement_lists.has(parents.get(parent)?.type ?? "")
      }
    }
    return false
  }

  for (const variable of module_scope.variables) {
    const expr = imported.get(variable.name)
    if (expr == null || !variable.defs.some((def) => def.type == "ImportBinding")) {
      continue
    }
    for (const ref of variable.references) {
      const id = ref.identifier as unknown as Node
      if (in_removed(id.start)) {
        continue
      }
      const parent = parents.get(id)
      if (parent?.type == "Property" && parent.shorthand && parent.value == id) {
        str.overwrite(id.start, id.end, `${variable.name}: ${expr}`)
      } else if (expr.includes(".") &&
                 ((parent?.type == "CallExpression" && parent.callee == id) || (parent?.type == "TaggedTemplateExpression" && parent.tag == id))) {
        // keep `this` undefined, like in ESM; guard against ASI, if the statement starts with `(`
        const guard = starts_statement(id) ? ";" : ""
        str.overwrite(id.start, id.end, `${guard}(0, ${expr})`)
      } else {
        str.overwrite(id.start, id.end, expr)
      }
    }
  }

  // Dynamic imports.
  const dynamic: string[] = []
  walk(program, (node) => {
    if (node.type == "ImportExpression") {
      if (node.source.type != "Literal" || typeof node.source.value != "string") {
        throw new ConversionError(`${file}: unsupported dynamic import`)
      }
      dynamic.push(node.source.value)
      str.overwrite(node.start, node.end, `Promise.resolve().then(() => ${tslib_ref()}.__importStar(require(${JSON.stringify(node.source.value)})))`)
    } else if (node.type == "MetaProperty" && node.meta.name == "import") {
      throw new ConversionError(`${file}: import.meta is not supported`)
    }
  })

  // Exports of reassigned bindings must be live, the rest can be plain properties.
  const reassigned = new Set<string>()
  for (const variable of module_scope.variables) {
    if (variable.references.some((ref) => ref.isWrite() && ref.init != true)) {
      reassigned.add(variable.name)
    }
  }

  const assignments = []
  for (const [name, {local, reexport}] of exported) {
    if (!reexport && reassigned.has(local)) {
      assignments.push(`Object.defineProperty(exports, ${JSON.stringify(name)}, {enumerable: true, get: () => ${local}});`)
    } else {
      const value = !reexport ? (imported.get(local) ?? local) : local
      assignments.push(`${prop("exports", name)} = ${value};`)
    }
  }
  // star exports don't override local ones, so must come after them
  for (const source of sources.values()) {
    if (source.star) {
      assignments.push(`${tslib_ref()}.__exportStar(${source.local}, exports);`)
    }
  }

  const tslib_require = tslib.name != null ? `const ${tslib.name} = require("tslib");\n` : ""
  str.prepend(`__esModule();\n${tslib_require}${hoisted}`)
  if (assignments.length != 0) {
    str.append(`\n${assignments.join("\n")}\n`)
  }
  const deps = [...sources.keys(), ...dynamic, ...(tslib.name != null ? ["tslib"] : [])]
  return {code: str.toString(), deps: [...new Set(deps)]}
}
