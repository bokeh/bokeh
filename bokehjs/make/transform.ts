import * as ts from "typescript"
export {SourceFile} from "typescript"

import {read} from "./fs"

function kind_of<T extends ts.Node>(node: ts.Node, kind: T["kind"]): node is T {
  return node.kind === kind
}

function is_ExpressionStatement(node: ts.Node): node is ts.ExpressionStatement {
  return kind_of(node, ts.SyntaxKind.ExpressionStatement)
}

function is_CallExpression(node: ts.Node): node is ts.CallExpression {
  return kind_of(node, ts.SyntaxKind.CallExpression)
}

function is_Identifier(node: ts.Node): node is ts.Identifier {
  return kind_of(node, ts.SyntaxKind.Identifier)
}

function is_StringLiteral(node: ts.Node): node is ts.StringLiteral {
  return kind_of(node, ts.SyntaxKind.StringLiteral)
}

function is_require(node: ts.Node): node is ts.CallExpression {
  return is_CallExpression(node) &&
         is_Identifier(node.expression) &&
         node.expression.text === "require" &&
         node.arguments.length === 1
}

export function collect_deps(source: ts.SourceFile): string[] {
  function traverse(node: ts.Node): void {
    if (is_require(node)) {
      const [arg] = node.arguments
      if (is_StringLiteral(arg) && arg.text.length > 0)
        deps.push(arg.text)
    }

    ts.forEachChild(node, traverse)
  }

  const deps: string[] = []
  traverse(source)
  return deps
}

export function rewrite_deps(source: ts.SourceFile, resolve: (dep: string) => number | string | undefined): ts.SourceFile {
  const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (root_node: T) => {
    function visit(node: ts.Node): ts.Node {
      if (is_require(node)) {
        const [arg] = node.arguments
        if (is_StringLiteral(arg) && arg.text.length > 0) {
          const dep = arg.text
          const val = resolve(dep)

          if (val != null) {
            node = ts.updateCall(node, node.expression, node.typeArguments, [ts.createLiteral(val)])
            ts.addSyntheticTrailingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, ` ${dep} `, false)
          }

          return node
        }
      }

      return ts.visitEachChild(node, visit, context)
    }

    return ts.visitNode(root_node, visit)
  }

  const result = ts.transform<ts.SourceFile>(source, [transformer])
  return result.transformed[0]
}

export function remove_use_strict(source: ts.SourceFile): ts.SourceFile {
  const stmts = source.statements.filter((node) => {
    if (is_ExpressionStatement(node)) {
      const expr = node.expression
      if (is_StringLiteral(expr) && expr.text == "use strict")
        return false
    }
    return true
  })

  return ts.updateSourceFileNode(source, stmts)
}

export function remove_esmodule(source: ts.SourceFile): ts.SourceFile {
  const stmts = source.statements.filter((node) => {
    if (is_ExpressionStatement(node)) {
      const expr = node.expression
      if (is_CallExpression(expr) && expr.arguments.length == 3) {
        const [, arg] = expr.arguments
        if (is_StringLiteral(arg) && arg.text == "__esModule")
          return false
      }
    }
    return true
  })

  return ts.updateSourceFileNode(source, stmts)
}

export function add_json_export(source: ts.SourceFile): ts.SourceFile {
  const stmts = [...source.statements]

  if (stmts.length != 0) {
    const last = stmts.pop()!

    if (is_ExpressionStatement(last)) {
      const left = ts.createPropertyAccess(ts.createIdentifier("module"), "exports")
      const right = last.expression
      const assign = ts.createStatement(ts.createAssignment(left, right))
      return ts.updateSourceFileNode(source, [...stmts, assign])
    }
  }

  return source
}

export function wrap_in_function(source: ts.SourceFile, mod_name: string): ts.SourceFile {
  const p = (name: string) => ts.createParameter(undefined, undefined, undefined, name)
  const params = [p("require"), p("module"), p("exports")]
  const block = ts.createBlock(source.statements, true)
  const func = ts.createFunctionDeclaration(undefined, undefined, undefined, "_", undefined, params, undefined, block)
  ts.addSyntheticLeadingComment(func, ts.SyntaxKind.MultiLineCommentTrivia, ` ${mod_name} `, false)
  return ts.updateSourceFileNode(source, [func])
}

export function parse_es(file: string, code?: string, target: ts.ScriptTarget = ts.ScriptTarget.ES5): ts.SourceFile {
  return ts.createSourceFile(file, code != null ? code : read(file)!, target, true, ts.ScriptKind.JS)
}

export function print_es(source: ts.SourceFile): string {
  const printer = ts.createPrinter()
  return printer.printNode(ts.EmitHint.SourceFile, source, source)
}
