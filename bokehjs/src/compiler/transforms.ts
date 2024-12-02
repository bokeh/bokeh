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

export function relativize_modules(relativize: (file: string, module_path: string) => string | null) {
  function relativize_specifier(context: ts.TransformationContext, source: ts.SourceFile, expr: ts.Expression | undefined): ts.StringLiteral | null {
    const {factory} = context
    if (expr != null && ts.isStringLiteralLike(expr) && expr.text.length > 0) {
      const relative = relativize(source.fileName, expr.text)
      if (relative != null) {
        return factory.createStringLiteral(relative)
      }
    }

    return null
  }

  return (context: ts.TransformationContext): ts.CustomTransformer => {
    return {
      transformSourceFile(root: ts.SourceFile): ts.SourceFile {
        const {factory} = context

        function visit(node: ts.Node): ts.Node {
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = relativize_specifier(context, root, node.moduleSpecifier)
            if (moduleSpecifier != null) {
              const {modifiers, importClause, assertClause} = node
              return factory.updateImportDeclaration(node, modifiers, importClause, moduleSpecifier, assertClause)
            }
          } else if (ts.isExportDeclaration(node)) {
            const moduleSpecifier = relativize_specifier(context, root, node.moduleSpecifier)
            if (moduleSpecifier != null) {
              const {modifiers, isTypeOnly, exportClause, assertClause} = node
              return factory.updateExportDeclaration(node, modifiers, isTypeOnly, exportClause, moduleSpecifier, assertClause)
            }
          } else if (is_require(node)) {
            const moduleSpecifier = relativize_specifier(context, root, node.arguments[0])
            if (moduleSpecifier != null) {
              const {expression, typeArguments} = node
              return factory.updateCallExpression(node, expression, typeArguments, [moduleSpecifier])
            }
          } else if (isImportCall(node)) {
            const moduleSpecifier = relativize_specifier(context, root, node.arguments[0])
            if (moduleSpecifier != null) {
              const {expression, typeArguments} = node
              return factory.updateCallExpression(node, expression, typeArguments, [moduleSpecifier])
            }
          } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
            const literal = relativize_specifier(context, root, node.argument.literal)
            if (literal != null) {
              const argument = factory.updateLiteralTypeNode(node.argument, literal)
              return factory.updateImportTypeNode(node, argument, node.attributes, node.qualifier, node.typeArguments, node.isTypeOf)
            }
          }

          return ts.visitEachChild(node, visit, context)
        }

        return ts.visitEachChild(root, visit, context)
      },
      transformBundle(_root: ts.Bundle): ts.Bundle {
        throw new Error("unsupported")
      },
    }
  }
}

function is_static(node: ts.Node): boolean {
  return ts.canHaveModifiers(node) && ts.getModifiers(node)?.find((modifier) => modifier.kind == ts.SyntaxKind.StaticKeyword) != null
}

export function insert_class_name() {
  function has__name__(node: ts.ClassDeclaration): boolean {
    return node.members.find((member) => ts.isPropertyDeclaration(member) && member.name.getText() == "__name__" && is_static(member)) != null
  }

  return (context: ts.TransformationContext) => (root: ts.SourceFile): ts.SourceFile => {
    const {factory} = context

    function visit(node: ts.Node): ts.VisitResult<ts.Node> {
      node = ts.visitEachChild(node, visit, context)

      if (ts.isClassDeclaration(node) && node.name != null && !has__name__(node)) {
        const property = factory.createPropertyDeclaration(
          factory.createModifiersFromModifierFlags(ts.ModifierFlags.Static),
          "__name__",
          undefined,
          undefined,
          factory.createStringLiteral(node.name.text))

        node = factory.updateClassDeclaration(
          node,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          [property, ...node.members])
      }

      return node
    }

    return ts.visitEachChild(root, visit, context)
  }
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

export type ExportNamespace = {
  type: "namespace"
  name?: string
  module: string
}

export type ExportBindings = {
  type: "bindings"
  bindings: [string | undefined, string][]
  module: string
}

export type ExportNamed = {
  type: "named"
  name: string
}

export type Exports = ExportNamespace | ExportBindings | ExportNamed

export function collect_exports(exported: Exports[]) {
  return (_context: ts.TransformationContext) => (root: ts.SourceFile) => {
    for (const statement of root.statements) {
      if (ts.isExportDeclaration(statement)) {
        if (statement.isTypeOnly) {
          continue
        }
        const {exportClause, moduleSpecifier} = statement
        if (moduleSpecifier == null || !ts.isStringLiteral(moduleSpecifier)) {
          continue
        }
        const module = moduleSpecifier.text
        if (exportClause == null) {
          // export * from "module"
          exported.push({type: "namespace", module})
        } else if (ts.isNamespaceExport(exportClause)) {
          // export * as name from "module"
          const name = exportClause.name.text
          exported.push({type: "namespace", name, module})
        } else if (ts.isNamedExports(exportClause)) {
          // export {name0, name1 as nameA} from "module"
          const bindings: [string | undefined, string][] = []
          for (const elem of exportClause.elements) {
            bindings.push([elem.propertyName?.text, elem.name.text])
          }
          exported.push({type: "bindings", bindings, module})
        }
      } else if (ts.isExportAssignment(statement) && !(statement.isExportEquals ?? false)) {
        // export default name
        exported.push({type: "named", name: "default"})
      } else if (ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement)) {
        const flags = ts.getCombinedModifierFlags(statement)
        if ((flags & ts.ModifierFlags.Export) != 0) {
          // export class X {}
          // export function f() {}
          if (statement.name != null) {
            const name = statement.name.text
            exported.push({type: "named", name})
          }
        } else if ((flags & ts.ModifierFlags.ExportDefault) != 0) {
          // export default class X {}
          // export function f() {}
          exported.push({type: "named", name: "default"})
        }
      }
    }

    return root
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

// XXX: this is pretty naive, but affects very little code
export function rename_exports() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile): ts.SourceFile => {
    const {factory} = context

    function is_exports(node: ts.Node): boolean {
      return ts.isIdentifier(node) && node.text == "exports"
    }

    const has_exports = root.statements.some((stmt) => {
      return ts.isVariableStatement(stmt) && stmt.declarationList.declarations.some((decl) => is_exports(decl.name))
    })

    if (has_exports) {
      function visit(node: ts.Node): ts.Node {
        if (is_exports(node)) {
          const updated = factory.createIdentifier("exports$1")
          const original = node
          ts.setOriginalNode(updated, original)
          ts.setTextRange(updated, original)
          return updated
        }

        return ts.visitEachChild(node, visit, context)
      }

      return ts.visitEachChild(root, visit, context)
    } else {
      return root
    }
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

export function fix_regl() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile): ts.SourceFile => {
    if (!root.fileName.endsWith("regl.js")) {
      return root
    }

    const {factory} = context

    function visit(node: ts.Node): ts.Node {
      if (ts.isFunctionDeclaration(node) && node.name != null && ts.isIdentifier(node.name)) {
        if (node.name.text == "guessCommand" || node.name.text == "guessCallSite") {
          const value = factory.createStringLiteral("unknown")
          const body = factory.createBlock([factory.createReturnStatement(value)])
          return factory.createFunctionDeclaration(undefined, undefined, node.name, undefined, [], undefined, body)
        }
      }

      return ts.visitEachChild(node, visit, context)
    }

    return ts.visitEachChild(root, visit, context)
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

export function parse_es(file: string, code?: string, target: ts.ScriptTarget = ts.ScriptTarget.ES2020): ts.SourceFile {
  return ts.createSourceFile(file, code != null ? code : ts.sys.readFile(file)!, target, true, ts.ScriptKind.JS)
}

export function print_es(source: ts.SourceFile): string {
  const printer = ts.createPrinter()
  return printer.printNode(ts.EmitHint.SourceFile, source, source)
}
