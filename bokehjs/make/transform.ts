import * as ts from "typescript"
export {SourceFile} from "typescript"

import {read} from "./fs"

function is_require(node: ts.Node): node is ts.CallExpression {
  return ts.isCallExpression(node) &&
         ts.isIdentifier(node.expression) &&
         node.expression.text === "require" &&
         node.arguments.length === 1
}

export function relativize_modules(relativize: (file: string, module_path: string) => string | null) {
  function relativize_specifier(source: ts.SourceFile, expr: ts.Expression | undefined): ts.StringLiteral | null {
    if (expr != null && ts.isStringLiteralLike(expr) && expr.text.length > 0) {
      const relative = relativize(source.fileName, expr.text)
      if (relative != null)
        return ts.createLiteral(relative)
    }

    return null
  }

  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function visit(node: ts.Node): ts.Node {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = relativize_specifier(root, node.moduleSpecifier)
        if (moduleSpecifier != null) {
          const {decorators, modifiers, importClause} = node
          return ts.updateImportDeclaration(node, decorators, modifiers, importClause, moduleSpecifier)
        }
      }
      if (ts.isExportDeclaration(node)) {
        const moduleSpecifier = relativize_specifier(root, node.moduleSpecifier)
        if (moduleSpecifier != null) {
          const {decorators, modifiers, exportClause} = node
          return ts.updateExportDeclaration(node, decorators, modifiers, exportClause, moduleSpecifier)
        }
      }
      if (is_require(node)) {
        const moduleSpecifier = relativize_specifier(root, node.arguments[0])
        if (moduleSpecifier != null) {
          const {expression, typeArguments} = node
          return ts.updateCall(node, expression, typeArguments, [moduleSpecifier])
        }
      }

      return ts.visitEachChild(node, visit, context)
    }

    return ts.visitNode(root, visit)
  }
}

export function collect_deps(source: ts.SourceFile): string[] {
  function traverse(node: ts.Node): void {
    if (is_require(node)) {
      const [arg] = node.arguments
      if (ts.isStringLiteral(arg) && arg.text.length > 0)
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
        if (ts.isStringLiteral(arg) && arg.text.length > 0) {
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
    if (ts.isExpressionStatement(node)) {
      const expr = node.expression
      if (ts.isStringLiteral(expr) && expr.text == "use strict")
        return false
    }
    return true
  })

  return ts.updateSourceFileNode(source, stmts)
}

export function remove_esmodule(source: ts.SourceFile): ts.SourceFile {
  const stmts = source.statements.filter((node) => {
    if (ts.isExpressionStatement(node)) {
      const expr = node.expression
      if (ts.isCallExpression(expr) && expr.arguments.length == 3) {
        const [, arg] = expr.arguments
        if (ts.isStringLiteral(arg) && arg.text == "__esModule")
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

    if (ts.isExpressionStatement(last)) {
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
