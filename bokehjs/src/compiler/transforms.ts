import * as ts from "typescript"

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

export function import_txt(load: (txt_path: string) => string | undefined) {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function visit(node: ts.Node): ts.VisitResult<ts.Node> {
      if (ts.isImportDeclaration(node)) {
        const {importClause, moduleSpecifier} = node

        if (ts.isStringLiteralLike(moduleSpecifier)) {
          const txt_path = moduleSpecifier.text
          if (txt_path.endsWith(".txt") && importClause != null && importClause.name != null) {
            const txt_text = load(txt_path)
            if (txt_text != null) {
              return ts.createVariableDeclaration(importClause.name, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), ts.createStringLiteral(txt_text))
            }
          }
        }
      }

      return ts.visitEachChild(node, visit, context)
    }

    return ts.visitNode(root, visit)
  }
}

function css_loader(css_text: string): ts.Node[] {
  const dom = ts.createTempVariable(undefined)
  return [
    ts.createImportDeclaration(
      undefined,
      undefined,
      ts.createImportClause(undefined, ts.createNamespaceImport(dom)),
      ts.createStringLiteral("core/dom")),
    ts.createExpressionStatement(
      ts.createCall(
        ts.createPropertyAccess(ts.createPropertyAccess(dom, "styles"), "append"),
        undefined,
        [ts.createStringLiteral(css_text)])),
  ]
}

export function import_css(load: (css_path: string) => string | undefined) {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function visit(node: ts.Node): ts.VisitResult<ts.Node> {
      if (ts.isImportDeclaration(node)) {
        const {importClause, moduleSpecifier} = node

        if (ts.isStringLiteralLike(moduleSpecifier)) {
          const css_path = moduleSpecifier.text
          if (importClause == null && css_path.endsWith(".css")) {
            const css_text = load(css_path)
            if (css_text != null) {
              return css_loader(css_text)
            }
          }
        }
      }

      return ts.visitEachChild(node, visit, context)
    }

    return ts.visitNode(root, visit)
  }
}

function is_static(node: ts.Node): boolean {
  return node.modifiers != null && node.modifiers.find((modifier) => modifier.kind == ts.SyntaxKind.StaticKeyword) != null
}

export function add_init_class() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function visit(node: ts.Node): ts.VisitResult<ts.Node> {
      node = ts.visitEachChild(node, visit, context)

      if (ts.isClassDeclaration(node) && node.name != null) {
        const name = `init_${node.name.getText()}`

        if (node.members.find((member) => ts.isMethodDeclaration(member) && member.name.getText() == name && is_static(member)) != null) {
          const init = ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(node.name, name), undefined, undefined))
          return [node, init]
        }
      }

      return node
    }

    return ts.visitNode(root, visit)
  }
}

export function insert_class_name() {
  function has__name__(node: ts.ClassDeclaration): boolean {
    return node.members.find((member) => ts.isPropertyDeclaration(member) && member.name.getText() == "__name__" && is_static(member)) != null
  }

  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function visit(node: ts.Node): ts.VisitResult<ts.Node> {
      node = ts.visitEachChild(node, visit, context)

      if (ts.isClassDeclaration(node) && node.name != null && !has__name__(node)) {
        const property = ts.createProperty(
          undefined,
          ts.createModifiersFromModifierFlags(ts.ModifierFlags.Static),
          "__name__",
          undefined,
          undefined,
          ts.createStringLiteral(node.name.text))

        node = ts.updateClassDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          [property, ...node.members])
      }

      return node
    }

    return ts.visitNode(root, visit)
  }
}

export function remove_use_strict() {
  return (_context: ts.TransformationContext) => (root: ts.SourceFile) => {
    const statements = root.statements.filter((node) => {
      if (ts.isExpressionStatement(node)) {
        const expr = node.expression
        if (ts.isStringLiteral(expr) && expr.text == "use strict")
          return false
      }
      return true
    })

    return ts.updateSourceFileNode(root, statements)
  }
}

export function remove_esmodule() {
  return (_context: ts.TransformationContext) => (root: ts.SourceFile) => {
    const statements = root.statements.filter((node) => {
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

    return ts.updateSourceFileNode(root, statements)
  }
}

export function collect_deps(source: ts.SourceFile): string[] {
  function traverse(node: ts.Node): void {
    if (is_require(node)) {
      const [arg] = node.arguments
      if (ts.isStringLiteral(arg) && arg.text.length > 0)
        deps.add(arg.text)
    }

    ts.forEachChild(node, traverse)
  }

  const deps = new Set<string>()
  traverse(source)
  return [...deps]
}

export function rewrite_deps(resolve: (dep: string) => number | string | undefined) {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
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

    return ts.visitNode(root, visit)
  }
}

// XXX: this is pretty naive, but affects very litte code
export function rename_exports() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function is_exports(node: ts.Node): boolean {
      return ts.isIdentifier(node) && node.text == "exports"
    }

    const has_exports = root.statements.some((stmt) => {
      return ts.isVariableStatement(stmt) && stmt.declarationList.declarations.some((decl) => is_exports(decl.name))
    })

    if (has_exports) {
      function visit(node: ts.Node): ts.Node {
        if (is_exports(node)) {
          const updated = ts.createIdentifier("exports$1")
          const original = node
          ts.setOriginalNode(updated, original)
          ts.setTextRange(updated, original)
          return updated
        }

        return ts.visitEachChild(node, visit, context)
      }

      return ts.visitNode(root, visit)
    } else
      return root
  }
}

export function add_json_export() {
  return (_context: ts.TransformationContext) => (root: ts.SourceFile) => {
    if (root.statements.length == 1) {
      const [statement] = root.statements

      if (ts.isExpressionStatement(statement)) {
        const left = ts.createPropertyAccess(ts.createIdentifier("module"), "exports")
        const right = statement.expression
        const assign = ts.createStatement(ts.createAssignment(left, right))
        return ts.updateSourceFileNode(root, [assign])
      }
    }

    return root
  }
}

export function wrap_in_function(module_name: string) {
  return (_context: ts.TransformationContext) => (root: ts.SourceFile) => {
    const p = (name: string) => ts.createParameter(undefined, undefined, undefined, name)
    const params = [p("require"), p("module"), p("exports")]
    const block = ts.createBlock(root.statements, true)
    const func = ts.createFunctionDeclaration(undefined, undefined, undefined, "_", undefined, params, undefined, block)
    ts.addSyntheticLeadingComment(func, ts.SyntaxKind.MultiLineCommentTrivia, ` ${module_name} `, false)
    return ts.updateSourceFileNode(root, [func])
  }
}

export function parse_es(file: string, code?: string, target: ts.ScriptTarget = ts.ScriptTarget.ES2017): ts.SourceFile {
  return ts.createSourceFile(file, code != null ? code : ts.sys.readFile(file)!, target, true, ts.ScriptKind.JS)
}

export function print_es(source: ts.SourceFile): string {
  const printer = ts.createPrinter()
  return printer.printNode(ts.EmitHint.SourceFile, source, source)
}
