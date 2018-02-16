import * as Lint from "tslint"
import * as ts from "typescript"

export class Rule extends Lint.Rules.AbstractRule {
  apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new ReturnTypeWalker(sourceFile, this.getOptions()))
  }
}

type Declaration = ts.MethodDeclaration | ts.SignatureDeclaration | ts.AccessorDeclaration

class ReturnTypeWalker extends Lint.RuleWalker {

  visitMethodDeclaration(node: ts.MethodDeclaration): void {
    this.checkReturnType(node)
  }

  visitMethodSignature(node: ts.SignatureDeclaration): void {
    this.checkReturnType(node)
  }

  visitGetAccessor(node: ts.AccessorDeclaration): void {
    this.checkReturnType(node)
  }

  private checkReturnType(node: Declaration): void {
    if (node.type == null) {
      const failure = `expected '${node.name == null ? "???" : node.name.getText()}' to have an explicit return type`
      this.addFailureAtNode(node, failure)
    }
  }
}
