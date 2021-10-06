import {NDArray} from "core/util/ndarray"
import {isFunction} from "core/util/types"

import {
  Parser,
  Expression,
  COMPOUND, LITERAL, IDENT, MEMBER, INDEX, CALL, UNARY, BINARY, SEQUENCE, ARRAY, FAILURE,
} from "./parser"

import {np, Numerical, is_Numerical} from "./linalg"

function evaluate(ast: Expression, refs: unknown[]): unknown {

  function resolve(ast: Expression): unknown {
    switch (ast.type) {
      case LITERAL:
        return ast.value
      case IDENT:
        if (ast.name.startsWith("$")) {
          const i = Number(ast.name.slice(1))
          if (isFinite(i) && 0 <= i && i < refs.length)
            return refs[i]
          else
            throw new Error(`invalid reference: ${ast.name}`)
        }

        switch (ast.name) {
          case "np":
            return np
          default:
            throw new Error(`unknown identifier: ${ast.name}`)
        }
      case MEMBER:
        const obj = resolve(ast.object)
        if (obj === np) {
          const {name} = ast.member
          if (Object.prototype.hasOwnProperty.call(np, name))
            return (np as any)[name]
          else
            throw new Error(`'np.${name}' doesn't exist`)
        } else
          throw new Error("not an accessable expression")
      case INDEX:
        throw new Error("not an indexable expression")
      case CALL:
        const callee = resolve(ast.callee)
        if (isFunction(callee))
          return callee.apply(undefined, ast.args.map((arg) => resolve(arg)))
        else
          throw new Error("not a callable expression")
      case UNARY: {
        const op = (() => {
          switch (ast.operator) {
            case "+": return np.pos
            case "-": return np.neg
            default:
              throw new Error(`unsupported operator: ${ast.operator}`)
          }
        })()
        const x = resolve(ast.argument)
        if (is_Numerical(x))
          return op(x)
        else
          throw new Error("a number or an array was expected")
      }
      case BINARY:
        const op = (() => {
          switch (ast.operator) {
            case "+": return np.add
            case "-": return np.sub
            case "*": return np.mul
            case "/": return np.div
            case "**": return np.pow
            default:
              throw new Error(`unsupported operator: ${ast.operator}`)
          }
        })()
        const x = resolve(ast.left)
        const y = resolve(ast.right)
        if (is_Numerical(x) && is_Numerical(y))
          return op(x, y)
        else
          throw new Error("a number or an array was expected")
      case COMPOUND:
      case SEQUENCE:
      case ARRAY:
      default:
        throw new Error("unsupported")
    }
  }

  return resolve(ast)
}

export function f(strings: TemplateStringsArray, ...subs: number[]): number
export function f(strings: TemplateStringsArray, ...subs: Numerical[]): NDArray

export function f(strings: TemplateStringsArray, ...subs: unknown[]): unknown {
  const [head, ...tail] = strings
  const input = head + tail.map((s, i) => `($${i})${s}`).join("")

  const parser = new Parser(input)
  const ast = parser.parse()

  if (ast.type != FAILURE)
    return evaluate(ast, subs)
  else
    throw new Error(ast.message)
}
