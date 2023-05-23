import {expect} from "assertions"

import {
  Parser,
  LITERAL, IDENT, MEMBER, INDEX, CALL, UNARY, BINARY, FAILURE,
} from "@bokehjs/api/parser"

import type {
  Expression, Literal, Identifier, MemberExpression, IndexExpression,
  CallExpression, UnaryExpression, BinaryExpression, Failure,
} from "@bokehjs/api/parser"

function parse(expr: string) {
  return new Parser(expr).parse()
}

function failure(message: string): Failure {
  return {type: FAILURE, message}
}

function literal(value: number | string): Literal {
  return {type: LITERAL, value}
}
function ident(name: string): Identifier {
  return {type: IDENT, name}
}

function member(object: Expression, member: Identifier): MemberExpression {
  return {type: MEMBER, object, member}
}
function index(object: Expression, index: Expression): IndexExpression {
  return {type: INDEX, object, index}
}
function call(callee: Expression, args: Expression[]): CallExpression {
  return {type: CALL, callee, args}
}

function neg(argument: Expression): UnaryExpression {
  return {type: UNARY, operator: "-", argument, prefix: true}
}
function pos(argument: Expression): UnaryExpression {
  return {type: UNARY, operator: "+", argument, prefix: true}
}

function sub(left: Expression, right: Expression): BinaryExpression {
  return {type: BINARY, left, operator: "-", right}
}
function add(left: Expression, right: Expression): BinaryExpression {
  return {type: BINARY, left, operator: "+", right}
}
function mul(left: Expression, right: Expression): BinaryExpression {
  return {type: BINARY, left, operator: "*", right}
}
function div(left: Expression, right: Expression): BinaryExpression {
  return {type: BINARY, left, operator: "/", right}
}
function pow(left: Expression, right: Expression): BinaryExpression {
  return {type: BINARY, left, operator: "**", right}
}

describe("Expression parser", () => {
  it("should support string constants", () => {
    expect(parse("'abc'")).to.be.equal(literal("abc"))
    expect(parse('"abc"')).to.be.equal(literal("abc"))
  })

  it("should support integer constants", () => {
    expect(parse("0")).to.be.equal(literal(0))
    expect(parse("1")).to.be.equal(literal(1))
    expect(parse("12")).to.be.equal(literal(12))
    expect(parse("123")).to.be.equal(literal(123))

    expect(parse("-0")).to.be.equal(neg(literal(0)))
    expect(parse("-1")).to.be.equal(neg(literal(1)))
    expect(parse("-12")).to.be.equal(neg(literal(12)))
    expect(parse("-123")).to.be.equal(neg(literal(123)))
  })

  it("should support number constants", () => {
    expect(parse(".3")).to.be.equal(literal(0.3))
    expect(parse("4.")).to.be.equal(literal(4.0))
    expect(parse("0.0")).to.be.equal(literal(0.0))
    expect(parse("0.3")).to.be.equal(literal(0.3))
    expect(parse("1.3")).to.be.equal(literal(1.3))
    expect(parse("12.34")).to.be.equal(literal(12.34))

    expect(parse("-.3")).to.be.equal(neg(literal(0.3)))
    expect(parse("-4.")).to.be.equal(neg(literal(4.0)))
    expect(parse("-0.0")).to.be.equal(neg(literal(0.0)))
    expect(parse("-0.3")).to.be.equal(neg(literal(0.3)))
    expect(parse("-1.3")).to.be.equal(neg(literal(1.3)))
    expect(parse("-12.34")).to.be.equal(neg(literal(12.34)))
  })

  it("should support scientific notation", () => {
    expect(parse("12.34e+0")).to.be.equal(literal(12.34e+0))
    expect(parse("12.34e-0")).to.be.equal(literal(12.34e-0))
    expect(parse("12.34e+1")).to.be.equal(literal(12.34e+1))
    expect(parse("12.34e-1")).to.be.equal(literal(12.34e-1))
    expect(parse("12.34e+12")).to.be.equal(literal(12.34e+12))
    expect(parse("12.34e-12")).to.be.equal(literal(12.34e-12))

    expect(parse("-12.34e+0")).to.be.equal(neg(literal(12.34e+0)))
    expect(parse("-12.34e-0")).to.be.equal(neg(literal(12.34e-0)))
    expect(parse("-12.34e+1")).to.be.equal(neg(literal(12.34e+1)))
    expect(parse("-12.34e-1")).to.be.equal(neg(literal(12.34e-1)))
    expect(parse("-12.34e+12")).to.be.equal(neg(literal(12.34e+12)))
    expect(parse("-12.34e-12")).to.be.equal(neg(literal(12.34e-12)))
  })

  it("should support identifiers", () => {
    expect(parse("abc")).to.be.equal(ident("abc"))
    expect(parse("_abc")).to.be.equal(ident("_abc"))
    expect(parse("abc_")).to.be.equal(ident("abc_"))
    expect(parse("_abc_")).to.be.equal(ident("_abc_"))
    expect(parse("Δέλτα")).to.be.equal(ident("Δέλτα"))
  })

  it("should support callables", () => {
    const a = ident("a")
    const b = ident("b")
    const c = ident("c")
    const _0 = literal(0)

    expect(parse("a(b)")).to.be.equal(call(a, [b]))
    expect(parse("(a)(b)")).to.be.equal(call(a, [b]))
    expect(parse("((a)(b))")).to.be.equal(call(a, [b]))

    expect(parse("a(0)")).to.be.equal(call(a, [_0]))
    expect(parse("(a)(0)")).to.be.equal(call(a, [_0]))
    expect(parse("((a)(0))")).to.be.equal(call(a, [_0]))

    expect(parse("a(b)(c)")).to.be.equal(call(call(a, [b]), [c]))
    expect(parse("(a(b))(c)")).to.be.equal(call(call(a, [b]), [c]))

    expect(parse("a(b(c))")).to.be.equal(call(a, [call(b, [c])]))

    expect(parse("a(b,c)")).to.be.equal(call(a, [b, c]))
    expect(parse("a(b, c)")).to.be.equal(call(a, [b, c]))
    expect(parse("a( b, c)")).to.be.equal(call(a, [b, c]))
    expect(parse("a( b,c)")).to.be.equal(call(a, [b, c]))
    expect(parse("a(b, c )")).to.be.equal(call(a, [b, c]))
    expect(parse("a( b, c )")).to.be.equal(call(a, [b, c]))

    expect(parse("a(0, b, c)")).to.be.equal(call(a, [_0, b, c]))
    expect(parse("a(0, b, 0, c)")).to.be.equal(call(a, [_0, b, _0, c]))
    expect(parse("a(0, b, 0, c, 0)")).to.be.equal(call(a, [_0, b, _0, c, _0]))
  })

  it("should support member access", () => {
    const a = ident("a")
    const b = ident("b")
    const c = ident("c")

    expect(parse("a.b")).to.be.equal(member(a, b))
    expect(parse("(a).b")).to.be.equal(member(a, b))
    expect(parse("(a.b)")).to.be.equal(member(a, b))
    expect(parse("a.(b)")).to.be.equal(failure("Unexpected '(' at character 2"))

    expect(parse("a.b.c")).to.be.equal(member(member(a, b), c))
    expect(parse("(a).b.c")).to.be.equal(member(member(a, b), c))
    expect(parse("(a.b).c")).to.be.equal(member(member(a, b), c))
    expect(parse("(a.b.c)")).to.be.equal(member(member(a, b), c))
    expect(parse("a.(b).c")).to.be.equal(failure("Unexpected '(' at character 2"))
    expect(parse("a.b.(c)")).to.be.equal(failure("Unexpected '(' at character 4"))
    expect(parse("a.(b).(c)")).to.be.equal(failure("Unexpected '(' at character 2"))

    const aa = ident("aa")
    const bb = ident("bb")
    const cc = ident("cc")

    expect(parse("aa.bb")).to.be.equal(member(aa, bb))
    expect(parse("aa.bb.cc")).to.be.equal(member(member(aa, bb), cc))

    expect(parse("Math.cos(rect.angle)")).to.be.equal(
      call(member(ident("Math"), ident("cos")), [member(ident("rect"), ident("angle"))]))
  })

  it("should support indexing", () => {
    const a = ident("a")
    const b = ident("b")
    const c = ident("c")

    expect(parse("a[b]")).to.be.equal(index(a, b))
    expect(parse("a[b][c]")).to.be.equal(index(index(a, b), c))
  })

  it("should support operations", () => {
    const _1 = literal(1)
    const _2 = literal(2)
    const _3 = literal(3)
    const _4 = literal(4)
    const _5 = literal(5)

    expect(parse("-1")).to.be.equal(neg(_1))
    expect(parse("+1")).to.be.equal(pos(_1))

    expect(parse("1+2")).to.be.equal(add(_1, _2))
    expect(parse("1-2")).to.be.equal(sub(_1, _2))
    expect(parse("1*2")).to.be.equal(mul(_1, _2))
    expect(parse("1/2")).to.be.equal(div(_1, _2))
    expect(parse("1**2")).to.be.equal(pow(_1, _2))

    expect(parse("1 +2")).to.be.equal(add(_1, _2))
    expect(parse("1 -2")).to.be.equal(sub(_1, _2))
    expect(parse("1 *2")).to.be.equal(mul(_1, _2))
    expect(parse("1 /2")).to.be.equal(div(_1, _2))
    expect(parse("1 **2")).to.be.equal(pow(_1, _2))

    expect(parse("1+ 2")).to.be.equal(add(_1, _2))
    expect(parse("1- 2")).to.be.equal(sub(_1, _2))
    expect(parse("1* 2")).to.be.equal(mul(_1, _2))
    expect(parse("1/ 2")).to.be.equal(div(_1, _2))
    expect(parse("1** 2")).to.be.equal(pow(_1, _2))

    expect(parse("1 + 2")).to.be.equal(add(_1, _2))
    expect(parse("1 - 2")).to.be.equal(sub(_1, _2))
    expect(parse("1 * 2")).to.be.equal(mul(_1, _2))
    expect(parse("1 / 2")).to.be.equal(div(_1, _2))
    expect(parse("1 ** 2")).to.be.equal(pow(_1, _2))

    expect(parse("1*2+3")).to.be.equal(add(mul(_1, _2), _3))
    expect(parse("(1*2+3)")).to.be.equal(add(mul(_1, _2), _3))
    expect(parse("(1)*(2)+(3)")).to.be.equal(add(mul(_1, _2), _3))
    expect(parse("(1*2)+3")).to.be.equal(add(mul(_1, _2), _3))
    expect(parse("(1*2)+(3)")).to.be.equal(add(mul(_1, _2), _3))
    expect(parse("((1*2))+(3)")).to.be.equal(add(mul(_1, _2), _3))
    expect(parse("(((1*2))+(3))")).to.be.equal(add(mul(_1, _2), _3))

    expect(parse("1*(2+3)")).to.be.equal(mul(_1, add(_2, _3)))
    expect(parse("1*((2+3))")).to.be.equal(mul(_1, add(_2, _3)))
    expect(parse("(1)*(2+3)")).to.be.equal(mul(_1, add(_2, _3)))
    expect(parse("(1)*((2+3))")).to.be.equal(mul(_1, add(_2, _3)))
    expect(parse("((1))*(2+3)")).to.be.equal(mul(_1, add(_2, _3)))
    expect(parse("((1))*((2+3))")).to.be.equal(mul(_1, add(_2, _3)))
    expect(parse("((1)*(2+3))")).to.be.equal(mul(_1, add(_2, _3)))
    expect(parse("((1)*((2)+(3)))")).to.be.equal(mul(_1, add(_2, _3)))

    expect(parse("(1+2)*3")).to.be.equal(mul(add(_1, _2), _3))
    expect(parse("(1+2)*3+4-2-5+2/2*3")).to.be.equal(add(sub(sub(add(mul(add(_1, _2), _3), _4), _2), _5), mul(div(_2, _2), _3)))
    expect(parse("1 + 2-   3*  4 /5")).to.be.equal(sub(add(_1, _2), div(mul(_3, _4), _5)))
    expect(parse("\n1\r\n+\n2\n")).to.be.equal(add(_1, _2))
  })

  it("should support unary minus", () => {
    const _1 = literal(1)
    const _2 = literal(2)

    expect(parse("-1+2")).to.be.equal(add(neg(_1), _2))
    expect(parse("-1-2")).to.be.equal(sub(neg(_1), _2))
    expect(parse("-1*2")).to.be.equal(mul(neg(_1), _2))
    expect(parse("-1/2")).to.be.equal(div(neg(_1), _2))
    //expect(parse("-1**2")).to.be.equal(neg(pow(_1, _2))) // XXX: fix schrodinger example when resolved

    expect(parse("-(1)+2")).to.be.equal(add(neg(_1), _2))
    expect(parse("-(1)-2")).to.be.equal(sub(neg(_1), _2))
    expect(parse("-(1)*2")).to.be.equal(mul(neg(_1), _2))
    expect(parse("-(1)/2")).to.be.equal(div(neg(_1), _2))
    //expect(parse("-(1)**2")).to.be.equal(neg(pow(_1, _2)))

    expect(parse("(-1)+2")).to.be.equal(add(neg(_1), _2))
    expect(parse("(-1)-2")).to.be.equal(sub(neg(_1), _2))
    expect(parse("(-1)*2")).to.be.equal(mul(neg(_1), _2))
    expect(parse("(-1)/2")).to.be.equal(div(neg(_1), _2))
    expect(parse("(-1)**2")).to.be.equal(pow(neg(_1), _2))

    expect(parse("-1+(-2)")).to.be.equal(add(neg(_1), neg(_2)))
    expect(parse("-1-(-2)")).to.be.equal(sub(neg(_1), neg(_2)))

    expect(parse("-1*-2")).to.be.equal(mul(neg(_1), neg(_2)))
    expect(parse("-1/-2")).to.be.equal(div(neg(_1), neg(_2)))
    //expect(parse("-1**-2")).to.be.equal(neg(pow(_1, neg(_2))))

    expect(parse("-(1)*-(2)")).to.be.equal(mul(neg(_1), neg(_2)))
    expect(parse("-(1)/-(2)")).to.be.equal(div(neg(_1), neg(_2)))
    //expect(parse("-(1)**-(2)")).to.be.equal(neg(pow(_1, neg(_2))))

    expect(parse("(-1)*(-2)")).to.be.equal(mul(neg(_1), neg(_2)))
    expect(parse("(-1)/(-2)")).to.be.equal(div(neg(_1), neg(_2)))
    expect(parse("(-1)**(-2)")).to.be.equal(pow(neg(_1), neg(_2)))
  })

  it("should support correct operator associativity", () => {
    const _1 = literal(1)
    const _2 = literal(2)
    const _3 = literal(3)
    const _4 = literal(4)

    expect(parse("1+2+3+4")).to.be.equal(add(add(add(_1, _2), _3), _4))
    expect(parse("1-2-3-4")).to.be.equal(sub(sub(sub(_1, _2), _3), _4))
    expect(parse("1*2*3*4")).to.be.equal(mul(mul(mul(_1, _2), _3), _4))
    expect(parse("1/2/3/4")).to.be.equal(div(div(div(_1, _2), _3), _4))
    //expect(parse("1**2**3**4")).to.be.equal(pow(_1, pow(_2, pow(_3, _4))))
  })
})
