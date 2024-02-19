// Based on https://ericsmekens.github.io/jsep/.

import {dict} from "core/util/object"

type Primitive = null | boolean | string | number | symbol

const TAB_CODE    =  9
const LF_CODE     = 10
const CR_CODE     = 13
const SPACE_CODE  = 32
const PERIOD_CODE = 46 // "."
const COMMA_CODE  = 44 // ","
const SQUOTE_CODE = 39 // single quote
const DQUOTE_CODE = 34 // double quotes
const OPAREN_CODE = 40 // (
const CPAREN_CODE = 41 // )
const OBRACK_CODE = 91 // [
const CBRACK_CODE = 93 // ]
// const QUMARK_CODE = 63 // ?
const SEMCOL_CODE = 59 // ;
// const COLON_CODE  = 58 // :

// Node Types
// ----------
// This is the full set of types that any JSEP node can be.
// Store them here to save space when minified
export const COMPOUND = Symbol("Compound")
export const LITERAL = Symbol("Literal")
export const IDENT = Symbol("Identifier")
export const MEMBER = Symbol("MemberExpression")
export const INDEX = Symbol("IndexExpression")
export const CALL = Symbol("CallExpression")
export const UNARY = Symbol("UnaryExpression")
export const BINARY = Symbol("BinaryExpression")
export const SEQUENCE = Symbol("SequenceExpression")
export const ARRAY = Symbol("ArrayExpression")
export const FAILURE = Symbol("Failure")

export type Expression =
  Identifier | Literal | UnaryExpression | BinaryExpression |
  CallExpression | MemberExpression | IndexExpression |
  SequenceExpression | ArrayExpression | CompoundExpression

export type Identifier = {
  type: typeof IDENT
  name: string
}

export type Literal = {
  type: typeof LITERAL
  value: Primitive
}

export type UnaryExpression = {
  type: typeof UNARY
  operator: string
  argument: Expression
  prefix: boolean
}

export type BinaryExpression = {
  type: typeof BINARY
  operator: string
  left: Expression
  right: Expression
}

export type CallExpression = {
  type: typeof CALL
  args: Expression[]
  callee: Expression
}

export type MemberExpression = {
  type: typeof MEMBER
  object: Expression
  member: Identifier
}

export type IndexExpression = {
  type: typeof INDEX
  object: Expression
  index: Expression
}

export type SequenceExpression = {
  type: typeof SEQUENCE
  expressions: Expression[]
}

export type ArrayExpression = {
  type: typeof ARRAY
  elements: Expression[]
}

export type CompoundExpression = {
  type: typeof COMPOUND
  body: Expression[]
}

export type Failure = {
  type: typeof FAILURE
  message: string
}

// Operations
// ----------
// Use a quickly-accessible map to store all of the unary operators
// Values are set to `1` (it really doesn't matter)
const unary_ops = dict<number>({
  "-": 1,
  "!": 1,
  "~": 1,
  "+": 1,
})

// Also use a map for the binary operations but set their values to their
// binary precedence for quick reference (higher number = higher precedence)
// see [Order of operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)
const binary_ops = dict<number>({
  "||":  1,
  "&&":  2,
  "|":   3,
  "^":   4,
  "&":   5,
  "==":  6, "!=":  6,
  "<":   7, ">":   7, "<=":  7, ">=": 7,
  "<<":  8, ">>":  8,
  "+":   9, "-":   9,
  "*":  10, "/":  10, "%":  10,
  "**": 11,
})

// Additional valid identifier chars, apart from a-z, A-Z and 0-9 (except on the starting char)
const additional_identifier_chars = new Set(["$", "_"])

// Literals
// ----------
// Store the values to return for the various literals we may encounter
const literals = dict<Primitive>({
  true: true,
  false: false,
  null: null,
})

function max_key_len(obj: Map<string, unknown>): number {
  return Math.max(0, ...[...obj.keys()].map((k) => k.length))
}

const max_unop_len = max_key_len(unary_ops)
const max_binop_len = max_key_len(binary_ops)

function binary_precedence(op_val: string): number {
  return binary_ops.get(op_val) ?? 0
}

function is_decimal_digit(ch: number): boolean {
  return ch >= 48 && ch <= 57 // 0...9
}

function is_identifier_start(ch: number): boolean {
  return (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 128 && !binary_ops.has(String.fromCharCode(ch))) || // any non-ASCII that is not an operator
    (additional_identifier_chars.has(String.fromCharCode(ch))) // additional characters
}

function is_identifier_part(ch: number): boolean {
  return is_identifier_start(ch) || is_decimal_digit(ch)
}

class ParseError extends Error {}

export class Parser {

  // `index` stores the character number we are currently at
  // All of the gobbles below will modify `index` as we move along
  private index: number = 0

  constructor(readonly expr: string) {}

  get char(): string {
    return this.expr.charAt(this.index)
  }

  get code(): number {
    return this.expr.charCodeAt(this.index)
  }

  /**
   * throw error at index of the expression
   */
  error(message: string): never {
    throw new ParseError(`${message} at character ${this.index}`)
  }

  /**
   * Push `index` up to the next non-space character
   */
  gobbleSpaces(): void {
    let ch = this.code
    while (ch == SPACE_CODE || ch == TAB_CODE || ch == LF_CODE || ch == CR_CODE) {
      ch = this.expr.charCodeAt(++this.index)
    }
  }

  /**
   * Top-level method to parse all expressions and returns compound or single node
   */
  parse(): Expression | Failure {
    try {
      const nodes = this.gobbleExpressions(undefined)
      // If there's only one expression just try returning the expression
      const node = nodes.length == 1 ? nodes[0] : {type: COMPOUND, body: nodes} as CompoundExpression
      return node
    } catch (error) {
      if (error instanceof ParseError) {
        return {type: FAILURE, message: error.message}
      } else {
        throw error
      }
    }
  }

  /**
   * top-level parser (but can be reused within as well)
   */
  gobbleExpressions(until: number | undefined): Expression[] {
    const nodes = []

    while (this.index < this.expr.length) {
      const ch_i = this.code

      // Expressions can be separated by semicolons, commas, or just inferred without any
      // separators
      if (ch_i == SEMCOL_CODE || ch_i == COMMA_CODE) {
        this.index++ // ignore separators
      } else {
        // Try to gobble each expression individually
        const node = this.gobbleExpression()
        if (node != false) {
          nodes.push(node)
          // If we weren't able to find a binary expression and are out of room, then
          // the expression passed in probably has too much
        } else if (this.index < this.expr.length) {
          if (ch_i == until) {
            break
          }
          this.error(`Unexpected '${this.char}'`)
        }
      }
    }

    return nodes
  }

  /**
   * The main parsing function.
   */
  gobbleExpression(): Expression | false {
    const node = this.gobbleBinaryExpression()
    this.gobbleSpaces()
    return node
  }

  /**
   * Search for the operation portion of the string (e.g. `+`, `===`)
   * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
   * and move down from 3 to 2 to 1 character until a matching binary operation is found
   * then, return that binary operation
   */
  gobbleBinaryOp(): string | false {
    this.gobbleSpaces()
    let to_check = this.expr.substring(this.index, this.index + max_binop_len)
    let tc_len = to_check.length

    while (tc_len > 0) {
      // Don't accept a binary op when it is an identifier.
      // Binary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (binary_ops.has(to_check) && (
        !is_identifier_start(this.code) ||
        (this.index + to_check.length < this.expr.length && !is_identifier_part(this.expr.charCodeAt(this.index + to_check.length)))
      )) {
        this.index += tc_len
        return to_check
      }
      to_check = to_check.substring(0, --tc_len)
    }
    return false
  }

  /**
   * This function is responsible for gobbling an individual expression,
   * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
   */
  gobbleBinaryExpression(): Expression | false {
    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't gobbleBinaryOp without a left-hand-side
    const left = this.gobbleToken()
    if (left == false) {
      return left
    }
    let biop = this.gobbleBinaryOp()

    // If there wasn't a binary operator, just return the leftmost node
    if (biop == false) {
      return left
    }

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    type BiOpInfo = {value: string, prec: number}
    let biop_info = {value: biop, prec: binary_precedence(biop)}

    const right = this.gobbleToken()
    if (right == false) {
      this.error(`Expected expression after ${biop}`)
    }

    const stack: (Expression | BiOpInfo)[] = [left, biop_info, right]

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    let cur_biop
    while ((biop = this.gobbleBinaryOp()) != false) {
      const prec = binary_precedence(biop)

      if (prec == 0) {
        this.index -= biop.length
        break
      }

      biop_info = {value: biop, prec}
      cur_biop = biop

      // Reduce: make a binary expression from the three topmost entries.
      while ((stack.length > 2) && (prec <= (stack[stack.length - 2] as BiOpInfo).prec)) {
        const right = stack.pop() as Expression
        const biop = (stack.pop() as BiOpInfo).value
        const left = stack.pop() as Expression
        const node: Expression = {
          type: BINARY,
          operator: biop,
          left,
          right,
        }
        stack.push(node)
      }

      const node = this.gobbleToken()

      if (node == false) {
        this.error(`Expected expression after ${cur_biop}`)
      }

      stack.push(biop_info, node)
    }

    let i = stack.length - 1
    let node = stack[i]

    while (i > 1) {
      node = {
        type: BINARY,
        operator: (stack[i - 1] as BiOpInfo).value,
        left: stack[i - 2] as Expression,
        right: node as Expression,
      }
      i -= 2
    }

    return node as Expression
  }

  /**
   * An individual part of a binary expression:
   * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
   */
  gobbleToken(): Expression | false {
    this.gobbleSpaces()

    const ch = this.code
    if (is_decimal_digit(ch) || ch == PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral()
    }

    let node: Expression | false = false
    if (ch == SQUOTE_CODE || ch == DQUOTE_CODE) {
      // Single or double quotes
      node = this.gobbleStringLiteral()
    } else if (ch == OBRACK_CODE) {
      node = this.gobbleArray()
    } else {
      let to_check = this.expr.substring(this.index, this.index + max_unop_len)
      let tc_len = to_check.length

      while (tc_len > 0) {
        // Don't accept an unary op when it is an identifier.
        // Unary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (unary_ops.has(to_check) && (
          !is_identifier_start(this.code) ||
          (this.index + to_check.length < this.expr.length && !is_identifier_part(this.expr.charCodeAt(this.index + to_check.length)))
        )) {
          this.index += tc_len
          const argument = this.gobbleToken()
          if (argument == false) {
            this.error("missing unaryOp argument")
          }
          return {
            type: UNARY,
            operator: to_check,
            argument,
            prefix: true,
          }
        }

        to_check = to_check.substring(0, --tc_len)
      }

      if (is_identifier_start(ch)) {
        node = this.gobbleIdentifier()
        const value = literals.get(node.name)
        if (value !== undefined) {
          node = {
            type: LITERAL,
            value,
          }
        }
      } else if (ch == OPAREN_CODE) { // open parenthesis
        node = this.gobbleGroup()
      }
    }

    if (node == false) {
      return false
    }

    node = this.gobbleTokenProperty(node)
    return node
  }

  /**
   * Gobble properties of of identifiers/strings/arrays/groups.
   * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
   * It also gobbles function calls:
   * e.g. `Math.acos(obj.angle)`
   */
  gobbleTokenProperty(node: Expression): Expression {
    this.gobbleSpaces()

    let ch = this.code
    while (ch == PERIOD_CODE || ch == OBRACK_CODE || ch == OPAREN_CODE) {
      this.index++

      if (ch == PERIOD_CODE) {
        this.gobbleSpaces()
        node = {
          type: MEMBER,
          object: node,
          member: this.gobbleIdentifier(),
        }
      } else if (ch == OBRACK_CODE) {
        const expr = this.gobbleExpression()
        if (expr == false) {
          this.error("Expected an expression")
        }
        node = {
          type: INDEX,
          object: node,
          index: expr,
        }
        this.gobbleSpaces()
        ch = this.code
        if (ch !== CBRACK_CODE) {
          this.error("Unclosed [")
        }
        this.index++
      } else { // ch == OPAREN_CODE
        // A function call is being made; gobble all the arguments
        node = {
          type: CALL,
          args: this.gobbleArguments(CPAREN_CODE),
          callee: node,
        }
      }
      this.gobbleSpaces()
      ch = this.code
    }

    return node
  }

  /**
   * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
   * keep track of everything in the numeric literal and then calling `parseFloat` on that string
   */
  gobbleNumericLiteral(): Literal {
    let number = ""

    while (is_decimal_digit(this.code)) {
      number += this.expr.charAt(this.index++)
    }

    if (this.code == PERIOD_CODE) { // can start with a decimal marker
      number += this.expr.charAt(this.index++)

      while (is_decimal_digit(this.code)) {
        number += this.expr.charAt(this.index++)
      }
    }

    let ch = this.char

    if (ch == "e" || ch == "E") { // exponent marker
      number += this.expr.charAt(this.index++)
      ch = this.char

      if (ch == "+" || ch == "-") { // exponent sign
        number += this.expr.charAt(this.index++)
      }

      while (is_decimal_digit(this.code)) { // exponent itself
        number += this.expr.charAt(this.index++)
      }

      if (!is_decimal_digit(this.expr.charCodeAt(this.index - 1))) {
        this.error(`Expected exponent (${number + this.char})`)
      }
    }

    const code = this.code

    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (is_identifier_start(code)) {
      this.error(`Variable names cannot start with a number (${number + this.char})`)
    } else if (code == PERIOD_CODE || (number.length == 1 && number.charCodeAt(0) == PERIOD_CODE)) {
      this.error("Unexpected ','")
    }

    return {
      type: LITERAL,
      value: parseFloat(number),
    }
  }

  /**
   * Parses a string literal, staring with single or double quotes with basic support for escape codes
   * e.g. `"hello world"`, `'this is\nJSEP'`
   */
  gobbleStringLiteral(): Literal {
    const quote = this.expr.charAt(this.index++)
    let str = ""
    let closed = false

    while (this.index < this.expr.length) {
      let ch = this.expr.charAt(this.index++)

      if (ch == quote) {
        closed = true
        break
      } else if (ch == "\\") {
        // Check for all of the common escape codes
        ch = this.expr.charAt(this.index++)

        switch (ch) {
          case "n": str += "\n"; break
          case "r": str += "\r"; break
          case "t": str += "\t"; break
          case "b": str += "\b"; break
          case "f": str += "\f"; break
          case "v": str += "\x0B"; break
          default : str += ch
        }
      } else {
        str += ch
      }
    }

    if (!closed) {
      this.error(`Unclosed quote after "${str}"`)
    }

    return {
      type: LITERAL,
      value: str,
    }
  }

  /**
   * Gobbles only identifiers
   * e.g.: `foo`, `_value`, `$x1`
   * Also, this function checks if that identifier is a literal:
   * (e.g. `true`, `false`, `null`) or `this`
   */
  gobbleIdentifier(): Identifier {
    let ch = this.code
    const start = this.index

    if (is_identifier_start(ch)) {
      this.index++
    } else {
      this.error(`Unexpected '${this.char}'`)
    }

    while (this.index < this.expr.length) {
      ch = this.code

      if (is_identifier_part(ch)) {
        this.index++
      } else {
        break
      }
    }
    return {
      type: IDENT,
      name: this.expr.slice(start, this.index),
    }
  }

  /**
   * Gobbles a list of arguments within the context of a function call
   * or array literal. This function also assumes that the opening character
   * `(` or `[` has already been gobbled, and gobbles expressions and commas
   * until the terminator character `)` or `]` is encountered.
   * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
   */
  gobbleArguments(termination: number): Expression[] {
    const args: Expression[] = []
    let closed = false
    let separator_count = 0

    while (this.index < this.expr.length) {
      this.gobbleSpaces()
      const ch_i = this.code

      if (ch_i == termination) { // done parsing
        closed = true
        this.index++

        if (termination == CPAREN_CODE && separator_count != 0 && separator_count >= args.length) {
          this.error(`Unexpected token '${String.fromCharCode(termination)}'`)
        }

        break
      } else if (ch_i == COMMA_CODE) { // between expressions
        this.index++
        separator_count++

        if (separator_count !== args.length) { // missing argument
          if (termination == CPAREN_CODE) {
            this.error("Unexpected token ','")
          } else if (termination == CBRACK_CODE) {
            for (let arg = args.length; arg < separator_count; arg++) {
              this.error("Expected an expression")
            }
          }
        }
      } else if (args.length !== separator_count && separator_count !== 0) {
        // NOTE: `&& separator_count !== 0` allows for either all commas, or all spaces as arguments
        this.error("Expected comma")
      } else {
        const node = this.gobbleExpression()

        if (node == false || node.type == COMPOUND) {
          this.error("Expected comma")
        }

        args.push(node)
      }
    }

    if (!closed) {
      this.error(`Expected ${String.fromCharCode(termination)}`)
    }

    return args
  }

  /**
   * Responsible for parsing a group of things within parentheses `()`
   * that have no identifier in front (so not a function call)
   * This function assumes that it needs to gobble the opening parenthesis
   * and then tries to gobble everything within that parenthesis, assuming
   * that the next thing it should see is the close parenthesis. If not,
   * then the expression probably doesn't have a `)`
   */
  gobbleGroup(): Expression | false {
    this.index++
    const nodes = this.gobbleExpressions(CPAREN_CODE)
    if (this.code == CPAREN_CODE) {
      this.index++
      if (nodes.length == 1) {
        return nodes[0]
      } else if (nodes.length == 0) {
        return false
      } else {
        return {
          type: SEQUENCE,
          expressions: nodes,
        }
      }
    } else {
      this.error("Unclosed (")
    }
  }

  /**
   * Responsible for parsing Array literals `[1, 2, 3]`
   * This function assumes that it needs to gobble the opening bracket
   * and then tries to gobble the expressions as arguments.
   */
  gobbleArray(): ArrayExpression {
    this.index++

    return {
      type: ARRAY,
      elements: this.gobbleArguments(CBRACK_CODE),
    }
  }
}
