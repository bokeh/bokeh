// XXX: all this code is copied from make/transform.ts, etc.

import * as ts from "typescript"

function kind_of<T extends ts.Node>(node: ts.Node, kind: T["kind"]): node is T {
  return node.kind === kind
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

export function insert_class_name() {
  function has__name__(node: ts.ClassDeclaration): boolean {
    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member) && member.name.getText() == "__name__" &&
          member.modifiers != null && member.modifiers.find((modifier) => modifier.kind == ts.SyntaxKind.StaticKeyword))
        return true
    }
    return false
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
