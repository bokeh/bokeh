import ts from "typescript"

export function apply<T extends ts.Node>(node: T, ...transforms: ts.TransformerFactory<T>[]): T {
  const result = ts.transform(node, transforms)
  return result.transformed[0]
}

function is_require(node: ts.Node): node is ts.CallExpression {
  return ts.isCallExpression(node) &&
         ts.isIdentifier(node.expression) &&
         node.expression.text === "require" &&
         node.arguments.length === 1
}

function isImportCall(node: ts.Node): node is ts.ImportCall {
  return ts.isCallExpression(node) && node.expression.kind == ts.SyntaxKind.ImportKeyword
}

export function remove_use_strict() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    const {factory} = context

    const statements = root.statements.filter((node) => {
      if (ts.isExpressionStatement(node)) {
        const expr = node.expression
        if (ts.isStringLiteral(expr) && expr.text == "use strict") {
          return false
        }
      }
      return true
    })

    return factory.updateSourceFile(root, statements)
  }
}

export function collect_imports(imports: Set<string>) {
  return (context: ts.TransformationContext) => (root: ts.SourceFile): ts.SourceFile => {
    function visit(node: ts.Node): ts.Node {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const name = node.moduleSpecifier
        if (name != null && ts.isStringLiteral(name) && name.text.length != 0) {
          imports.add(name.text)
        }
      } else if (isImportCall(node)) {
        const [name] = node.arguments
        if (ts.isStringLiteral(name) && name.text.length != 0) {
          imports.add(name.text)
        }
      }

      return ts.visitEachChild(node, visit, context)
    }
    return ts.visitEachChild(root, visit, context)
  }
}

export function collect_deps(source: ts.SourceFile): string[] {
  function traverse(node: ts.Node): void {
    if (is_require(node)) {
      const [arg] = node.arguments
      if (ts.isStringLiteral(arg) && arg.text.length > 0) {
        deps.add(arg.text)
      }
    }

    ts.forEachChild(node, traverse)
  }

  const deps = new Set<string>()
  traverse(source)
  return [...deps]
}

export function rewrite_deps(resolve: (dep: string) => number | string | undefined) {
  return (context: ts.TransformationContext) => (root: ts.SourceFile): ts.SourceFile => {
    const {factory} = context

    function visit(node: ts.Node): ts.Node {
      if (is_require(node)) {
        const [arg] = node.arguments
        if (ts.isStringLiteral(arg) && arg.text.length > 0) {
          const dep = arg.text
          const val = resolve(dep)

          if (val != null) {
            const literal = typeof val == "string" ? factory.createStringLiteral(val) : factory.createNumericLiteral(val)
            node = factory.updateCallExpression(node, node.expression, node.typeArguments, [literal])
            ts.addSyntheticTrailingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, ` ${dep} `, false)
          }

          return node
        }
      }

      return ts.visitEachChild(node, visit, context)
    }

    return ts.visitEachChild(root, visit, context)
  }
}

export function fix_esmodule() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    const {factory} = context

    let found = false
    const statements = root.statements.map((node) => {
      if (!found && ts.isExpressionStatement(node)) {
        const expr = node.expression
        if (ts.isCallExpression(expr) && expr.arguments.length == 3) {
          const [, arg] = expr.arguments
          if (ts.isStringLiteral(arg) && arg.text == "__esModule") {
            found = true
            const es_module = factory.createIdentifier("__esModule")
            const call = factory.createCallExpression(es_module, [], [])
            return factory.createExpressionStatement(call)
          }
        }
      }
      return node
    })

    return factory.updateSourceFile(root, statements)
  }
}

export function remove_void0() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    const {factory} = context

    let found = false
    const statements = root.statements.filter((node) => {
      if (!found && ts.isExpressionStatement(node)) {
        let {expression} = node
        while (ts.isBinaryExpression(expression) &&
               ts.isPropertyAccessExpression(expression.left) &&
               ts.isIdentifier(expression.left.expression) &&
               expression.left.expression.text == "exports") {
          expression = expression.right
        }
        if (ts.isVoidExpression(expression)) {
          found = true
          return false
        }
      }
      return true
    })

    return factory.updateSourceFile(root, statements)
  }
}

export function fix_esexports() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    const {factory} = context

    const statements = root.statements.map((node) => {
      if (ts.isExpressionStatement(node)) {
        const expr = node.expression
        if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression) && expr.arguments.length == 3) {
          const {expression, name} = expr.expression
          if (ts.isIdentifier(expression) && expression.text == "Object" &&
              ts.isIdentifier(name) && name.text == "defineProperty") {
            const [exports, name, config] = expr.arguments
            if (ts.isIdentifier(exports) && exports.text == "exports" &&
                ts.isStringLiteral(name) &&
                ts.isObjectLiteralExpression(config)) {

              for (const item of config.properties) {
                if (ts.isPropertyAssignment(item) &&
                    ts.isIdentifier(item.name) && item.name.text == "get" &&
                    ts.isFunctionExpression(item.initializer)) {
                  const {statements} = item.initializer.body
                  if (statements.length == 1) {
                    const [stmt] = statements
                    if (ts.isReturnStatement(stmt) && stmt.expression != null) {
                      const es_export = factory.createIdentifier("__esExport")
                      const call = factory.createCallExpression(es_export, [], [name, stmt.expression])
                      return factory.createExpressionStatement(call)
                    }
                  }
                }
              }
            }
          }
        }
      }
      return node
    })

    return factory.updateSourceFile(root, statements)
  }
}

export function wrap_in_function(module_name: string) {
  return (context: ts.TransformationContext) => (root: ts.SourceFile): ts.SourceFile => {
    const {factory} = context
    const p = (name: string) => factory.createParameterDeclaration(undefined, undefined, name)
    const params = [p("require"), p("module"), p("exports"), p("__esModule"), p("__esExport")]
    const block = factory.createBlock(root.statements, true)
    const func = factory.createFunctionDeclaration(undefined, undefined, "_", undefined, params, undefined, block)
    ts.addSyntheticLeadingComment(func, ts.SyntaxKind.MultiLineCommentTrivia, ` ${module_name} `, false)
    return factory.updateSourceFile(root, [func])
  }
}

export function parse_es(file: string, code?: string, target: ts.ScriptTarget = ts.ScriptTarget.ES2024): ts.SourceFile {
  return ts.createSourceFile(file, code != null ? code : ts.sys.readFile(file)!, target, true, ts.ScriptKind.JS)
}

export function print_es(source: ts.SourceFile): string {
  const printer = ts.createPrinter()
  return printer.printNode(ts.EmitHint.SourceFile, source, source)
}
