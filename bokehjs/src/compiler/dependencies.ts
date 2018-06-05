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
