// ESM -> CJS conversion of individual modules (oxc-parser + eslint-scope + MagicString).
//
// Rewrites only what CJS requires: import/export statements and references to imported
// bindings. Everything else, including names of classes and functions, is left as is.
// Interop with CJS modules and `export *` use tslib's helpers, like tsc's output.
//
// Like in tsc's output, exports are assigned as early as possible, so that modules
// tolerate import cycles: exported functions (hoisted) and live bindings at the top,
// other declarations right after their statements and re-exports right after the
// respective `require()`. A module in a cycle can still observe exports, which aren't
// initialized yet, if it accesses them during its own evaluation (as in ESM).
import {parseSync} from "oxc-parser"
import MagicString from "magic-string"
import * as eslint_scope from "eslint-scope"

import {walk} from "./transforms.js"
import type {SourceMap} from "./source_map.js"
import {edits_map} from "./source_map.js"

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

export function to_cjs(file: string, code: string): {code: string, map: SourceMap, deps: string[]} {
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
  // local import binding -> its import statement
  const import_stmt_of = new Map<string, Node>()

  type Export = {name: string} & ({kind: "local", local: string} | {kind: "reexport", value: string, stmt: Node})
  const exported: Export[] = []

  // top-level declarations: name -> declaring statement
  const declarations = new Map<string, {stmt: Node, hoisted: boolean}>()
  for (const stmt of program.body as Node[]) {
    const decl = stmt.type == "ExportNamedDeclaration" || stmt.type == "ExportDefaultDeclaration" ? stmt.declaration : stmt
    switch (decl?.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        if (decl.id != null) {
          declarations.set(decl.id.name, {stmt, hoisted: decl.type == "FunctionDeclaration"})
        }
        break
      case "VariableDeclaration":
        for (const d of decl.declarations) {
          for (const name of bound_names(d.id)) {
            declarations.set(name, {stmt, hoisted: false})
          }
        }
        break
    }
  }

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
          import_stmt_of.set(local, stmt)
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
        removed.push([stmt.start, stmt.end])
        break
      }
      case "ExportAllDeclaration": {
        const source = source_of(stmt.source.value)
        if (stmt.exported != null) {
          source.namespace = true
          const name = stmt.exported.type == "Identifier" ? stmt.exported.name : stmt.exported.value
          exported.push({name, kind: "reexport", value: source.local, stmt})
        } else {
          source.star = true
        }
        pending_requires.push({stmt, source})
        removed.push([stmt.start, stmt.end])
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
            exported.push({name: as, kind: "reexport", value: prop(source.local, name), stmt})
          }
          pending_requires.push({stmt, source})
          removed.push([stmt.start, stmt.end])
        } else if (stmt.declaration != null) {
          const {declaration} = stmt
          str.remove(stmt.start, declaration.start)
          if (declaration.type == "VariableDeclaration") {
            for (const decl of declaration.declarations) {
              for (const name of bound_names(decl.id)) {
                exported.push({name, kind: "local", local: name})
              }
            }
          } else {
            exported.push({name: declaration.id.name, kind: "local", local: declaration.id.name})
          }
        } else {
          for (const spec of stmt.specifiers) {
            const local = spec.local.name
            const as = spec.exported.type == "Identifier" ? spec.exported.name : spec.exported.value
            exported.push({name: as, kind: "local", local})
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
          exported.push({name: "default", kind: "local", local: declaration.id.name})
        } else {
          const local = fresh("default")
          str.overwrite(stmt.start, declaration.start, `const ${local} = `)
          if (declaration.type == "FunctionDeclaration" || declaration.type == "ClassDeclaration") {
            str.appendLeft(declaration.end, ";")
          }
          exported.push({name: "default", kind: "local", local})
          declarations.set(local, {stmt, hoisted: false})
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

  const assign = (name: string, value: string) => `${prop("exports", name)} = ${value};`
  const live = (name: string, local: string) => `Object.defineProperty(exports, ${JSON.stringify(name)}, {enumerable: true, get: () => ${local}});`

  const top: string[] = []                        // before requires
  const after_require = new Map<Node, string[]>() // import-like statement -> assignments
  const after_stmt = new Map<Node, string[]>()    // declaring statement -> assignments
  const end: string[] = []
  const push = (map: Map<Node, string[]>, stmt: Node, line: string) => map.set(stmt, [...map.get(stmt) ?? [], line])

  for (const exp of exported) {
    if (exp.kind == "reexport") {
      push(after_require, exp.stmt, assign(exp.name, exp.value))
      continue
    }
    const {name, local} = exp
    const import_stmt = import_stmt_of.get(local)
    const decl = declarations.get(local)
    if (import_stmt != null) {
      push(after_require, import_stmt, assign(name, imported.get(local)!))
    } else if (reassigned.has(local)) {
      top.push(live(name, local))
    } else if (decl == null) {
      end.push(assign(name, local)) // e.g. `var` in a block
    } else if (decl.hoisted) {
      top.push(assign(name, local))
    } else {
      push(after_stmt, decl.stmt, assign(name, local))
    }
  }
  // star exports don't override local ones, so must come after them
  for (const source of sources.values()) {
    if (source.star) {
      end.push(`${tslib_ref()}.__exportStar(${source.local}, exports);`)
    }
  }

  // Emit requires: one per source, at its first import-like statement.
  const emitted = new Set<Source>()
  let hoisted = ""
  for (const {stmt, source} of pending_requires) {
    const text = emitted.has(source) ? "" : `const ${source.local} = ${require_of(source)};`
    emitted.add(source)
    const is_side_effect_only = stmt.type == "ImportDeclaration" && stmt.specifiers.length == 0
    const required = is_side_effect_only && !source.default && !source.named && !source.namespace && !source.star ? `require(${JSON.stringify(source.spec)});` : text
    const replacement = [required, ...after_require.get(stmt) ?? []].filter((line) => line.length != 0).join("\n")
    if (hoist) {
      hoisted += replacement.length != 0 ? `${replacement}\n` : ""
      str.remove(stmt.start, stmt.end)
    } else if (replacement.length == 0) {
      str.remove(stmt.start, stmt.end)
    } else {
      str.overwrite(stmt.start, stmt.end, replacement)
    }
  }

  for (const [stmt, lines] of after_stmt) {
    str.appendLeft(stmt.end, `\n${lines.join("\n")}`)
  }

  const tslib_require = tslib.name != null ? `const ${tslib.name} = require("tslib");\n` : ""
  const top_lines = top.length != 0 ? `${top.join("\n")}\n` : ""
  str.prepend(`__esModule();\n${tslib_require}${top_lines}${hoisted}`)
  if (end.length != 0) {
    str.append(`\n${end.join("\n")}\n`)
  }
  const deps = [...sources.keys(), ...dynamic, ...(tslib.name != null ? ["tslib"] : [])]
  const map = edits_map(str, file)
  return {code: str.toString(), map, deps: [...new Set(deps)]}
}
