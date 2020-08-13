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
          return ts.updateExportDeclaration(node, decorators, modifiers, exportClause, moduleSpecifier, false)
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

function isImportCall(node: ts.Node): node is ts.ImportCall {
  return ts.isCallExpression(node) && node.expression.kind == ts.SyntaxKind.ImportKeyword
}

export function collect_imports(imports: Set<string>) {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function visit(node: ts.Node): ts.Node {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const name = node.moduleSpecifier
        if (name != null && ts.isStringLiteral(name) && name.text.length != 0)
          imports.add(name.text)
      } else if (isImportCall(node)) {
        const [name] = node.arguments
        if (ts.isStringLiteral(name) && name.text.length != 0)
          imports.add(name.text)
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

/**
 * Transform `var _this = _super.call(this, seq) || this;` into `var _this = new _super(seq);`.
 */
export function es5_fix_extend_builtins() {
  return (context: ts.TransformationContext) => (root: ts.SourceFile) => {
    function visit(node: ts.Node): ts.Node {
      if (ts.isFunctionDeclaration(node)) {
        if (node.name != null && node.name.text.endsWith("NDArray") && node.body != null) {
          const [stmt, ...rest] = node.body.statements
          if (ts.isVariableStatement(stmt) && stmt.declarationList.declarations.length == 1) {
            const [decl] = stmt.declarationList.declarations
            if (ts.isIdentifier(decl.name) && decl.name.text == "_this" && decl.initializer != null) {
              const init = ts.createNew(ts.createIdentifier("_super"), undefined, [ts.createIdentifier("seq")])
              const decl_new = ts.updateVariableDeclaration(decl, decl.name, decl.type, init)
              const decls_new = ts.updateVariableDeclarationList(stmt.declarationList, [decl_new])
              const stmt_new = ts.updateVariableStatement(stmt, stmt.modifiers, decls_new)
              const body = ts.createBlock([stmt_new, ...rest], true)
              const constructor = ts.updateFunctionDeclaration(node, node.decorators, node.modifiers,
                node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, body)
              return constructor
            }
          }
        }
      }

      return ts.visitEachChild(node, visit, context)
    }

    return ts.visitNode(root, visit)
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
