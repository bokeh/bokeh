import type {Program, ParserOptions, ParseResult} from "oxc-parser"
import {parseSync, rawTransferSupported} from "oxc-parser"
import MagicString from "magic-string"

import type {SourceMap} from "./source_map.js"
import {edits_map} from "./source_map.js"

type Node = {type: string, start: number, end: number, [key: string]: any}

export function walk(node: unknown, visit: (node: Node, parent: Node | null) => void, parent: Node | null = null): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, visit, parent)
    }
  } else if (node != null && typeof node == "object" && typeof (node as Node).type == "string") {
    visit(node as Node, parent)
    for (const key in node) {
      if (key != "type" && key != "start" && key != "end" && key != "range") {
        walk((node as Node)[key], visit, node as Node)
      }
    }
  }
}

// Raw transfer builds ASTs several times faster than (default) JSON transfer, but it isn't
// supported everywhere, e.g. by WASI bindings of the extensions' compiler.
const raw_transfer = rawTransferSupported()

/** Parses `code` of `file` like `parseSync()`, using raw transfer when supported. */
export function parse(file: string, code: string, options: ParserOptions): ParseResult {
  return parseSync(file, code, {...options, experimentalRawTransfer: raw_transfer} as ParserOptions)
}

/** Whether `code` has `import` or `export` statements, or `import.meta`. */
export function has_module_syntax(file: string, code: string): boolean {
  const {module, errors} = parse(file, code, {sourceType: "unambiguous"})
  return errors.length == 0 && module.hasModuleSyntax
}

export function parse_script(file: string, code: string): Program {
  const {program, errors} = parse(file, code, {sourceType: "script", preserveParens: false})
  if (errors.length != 0) {
    throw new Error(`failed to parse ${file}: ${errors.map((error) => error.message).join("\n")}`)
  }
  return program
}

type Require = {call: Node, arg: Node, dep: string}

function is_string(node: Node | undefined): node is Node & {value: string} {
  return node != null && node.type == "Literal" && typeof node.value == "string"
}

/** Finds `require("dep")` calls. */
function find_requires(program: Program): Require[] {
  const requires: Require[] = []
  walk(program, (node) => {
    if (node.type == "CallExpression" && node.callee.type == "Identifier" && node.callee.name == "require" && node.arguments.length == 1) {
      const [arg] = node.arguments
      if (is_string(arg) && arg.value.length != 0) {
        requires.push({call: node, arg, dep: arg.value})
      }
    }
  })
  return requires
}

export function collect_deps(program: Program): string[] {
  return [...new Set(find_requires(program).map(({dep}) => dep))]
}

function is_exports_member(node: Node): boolean {
  return node.type == "MemberExpression" && !node.computed && node.object.type == "Identifier" && node.object.name == "exports"
}

function is_define_property(node: Node): boolean {
  return node.type == "CallExpression" && node.arguments.length == 3 &&
    node.callee.type == "MemberExpression" && !node.callee.computed &&
    node.callee.object.type == "Identifier" && node.callee.object.name == "Object" &&
    node.callee.property.type == "Identifier" && node.callee.property.name == "defineProperty" &&
    node.arguments[0].type == "Identifier" && node.arguments[0].name == "exports" &&
    is_string(node.arguments[1])
}

/** Removes `"use strict"` directives, because bundles are strict anyway. */
function remove_use_strict(program: Program, str: MagicString): void {
  for (const stmt of program.body as Node[]) {
    if (stmt.type == "ExpressionStatement" && stmt.directive == "use strict") {
      str.remove(stmt.start, stmt.end)
    }
  }
}

/** Replaces `Object.defineProperty(exports, "__esModule", {value: true})` with `__esModule()`. */
function fix_esmodule(program: Program, str: MagicString): void {
  for (const stmt of program.body as Node[]) {
    if (stmt.type == "ExpressionStatement" && is_define_property(stmt.expression) && stmt.expression.arguments[1].value == "__esModule") {
      str.overwrite(stmt.expression.start, stmt.expression.end, "__esModule()")
      break
    }
  }
}

/** Removes `exports.a = exports.b = ... = void 0` predeclarations of exports. */
function remove_void0(program: Program, str: MagicString): void {
  for (const stmt of program.body as Node[]) {
    if (stmt.type == "ExpressionStatement") {
      let expr = stmt.expression
      while (expr.type == "AssignmentExpression" && expr.operator == "=" && is_exports_member(expr.left)) {
        expr = expr.right
      }
      if (expr != stmt.expression && expr.type == "UnaryExpression" && expr.operator == "void") {
        str.remove(stmt.start, stmt.end)
      }
    }
  }
}

type Resolve = (dep: string) => number | string | undefined

/**
 * Prepares a CommonJS module for a bundle: removes redundant code, replaces
 * dependencies with module IDs and wraps the module in a function.
 */
export function link_module(file: string, code: string, module_name: string, resolve: Resolve): {code: string, map: SourceMap} {
  const program = parse_script(file, code)
  const str = new MagicString(code)

  if (program.hashbang != null) {
    str.remove(program.hashbang.start, program.hashbang.end)
  }

  remove_use_strict(program, str)
  fix_esmodule(program, str)
  remove_void0(program, str)

  for (const {call, arg, dep} of find_requires(program)) {
    const id = resolve(dep)
    if (id != null) {
      str.overwrite(arg.start, arg.end, typeof id == "string" ? JSON.stringify(id) : `${id}`)
      str.appendLeft(call.end, ` /* ${dep.replaceAll("*/", "*\\/")} */`)
    }
  }

  str.prepend(`/* ${module_name} */ function _(require, module, exports, __esModule, __esExport) {\n`)
  str.append("\n}")
  const map = edits_map(str, file)
  return {code: str.toString(), map}
}
