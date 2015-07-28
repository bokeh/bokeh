# build phosphor-related stuff

gulp = require "gulp"
ts = require "typescript"
through = require "gulp-through"

paths = require "../paths"
utils = require "../utils"

class Module
  constructor: (@name, @submodules, @classes) ->

  toString: () ->
    "Module(#{@name})"

class Class
  constructor: (@name, @heritage, @methods, @properties) ->

  toString: () ->
    "Class(#{@name} extends #{@heritage})"

class Interface
  constructor: (@name, @heritage, @methods, @properties) ->

  toString: () ->
    "Interface(#{@name} extends #{@heritage})"

class Method
  constructor: (@name, @parameters, @returnValue) ->

  toString: () ->
    "Method(#{@name})"

class Property
  constructor: (@name, @type) ->

  toString: () ->
    "Property(#{@name}: #{@type})"

class Type

class UnknownType extends Type
  constructor: () ->

  toString: () ->
    "UnknownType()"

class PrimitiveType extends Type
  constructor: (@name) ->

  toString: () ->
    "PrimitiveType(#{@name})"

class IdentifierType extends Type
  constructor: (@name) ->

  toString: () ->
    "IdentifierType(#{@name})"

class ArrayType extends Type
  constructor: (@elementType) ->

  toString: () ->
    "ArrayType(#{@elementType})"

class Parameter
  constructor: (@name, @type) ->

  toString: () ->
    "Parameter(#{@name}: #{@type})"

coalesceModules = (modules) ->
  sorted = modules.concat([]).sort((a,b) -> a.name.localeCompare(b.name))
  coalesced = []
  for m in sorted
    last = null
    if coalesced.length > 0
      last = coalesced[coalesced.length - 1]
    if last and last.name == m.name
      last.submodules = last.submodules.concat(m.submodules)
      last.classes = last.classes.concat(m.classes)
    else
      coalesced.push(m)

  for c in coalesced
    c.submodules = coalesceModules(c.submodules)

  coalesced

parseFile = (path, contents) ->
  sourceFile = ts.createSourceFile(path,
    contents,
    ts.ScriptTarget.ES6, true) # true=setParentNodes

  report = (node, message) ->
    pos = sourceFile.getLineAndCharacterOfPosition(node.getStart())
    console.log("#{pos.line}: #{pos.character}: #{ts.SyntaxKind[node.kind]}:  #{message}")
    throw new Error("#{pos.line}: #{pos.character}: #{ts.SyntaxKind[node.kind]}:  #{message}")

  parseType = (node) ->
    switch node.kind
      when ts.SyntaxKind.ArrayType
        new ArrayType(parseType(node.elementType))
      when ts.SyntaxKind.TypeReference
        # could be a class name or a generic parameter
        new IdentifierType(node.typeName.text)
      when ts.SyntaxKind.FunctionType
        new UnknownType()
      else
        typeName =
          switch node.kind
            when ts.SyntaxKind.NumberKeyword
              "number"
            when ts.SyntaxKind.BooleanKeyword
              "boolean"
            when ts.SyntaxKind.StringKeyword
              "string"
            when ts.SyntaxKind.AnyKeyword
              "any"
            else
              report(node, "Unknown type node kind")
        new PrimitiveType(typeName)

  parseHeritage = (node, accumulateSupers) ->
    # there are lots of cases this won't handle probably,
    # fix them as they arise
    switch node.token
      when ts.SyntaxKind.ExtendsKeyword, ts.SyntaxKind.ImplementsKeyword
        for t in node.types
          switch t.kind
            when ts.SyntaxKind.ExpressionWithTypeArguments
              switch t.expression.kind
                when ts.SyntaxKind.Identifier
                  accumulateSupers.push(new IdentifierType(t.expression.text))
                else
                  report(t.expression, "unknown heritage expression kind")
            else
              report(t, "unknown heritage type")
      else
        report(node, "unknown heritage token " + ts.SyntaxKind[node.token])

  parseClassChild = (className, node, accumulateSupers, accumulateMethods, accumulateProperties) ->
    switch node.kind
      when ts.SyntaxKind.HeritageClause
        parseHeritage(node, accumulateSupers)
      when ts.SyntaxKind.PropertyDeclaration, ts.SyntaxKind.PropertySignature
        console.log("  property " + node.name.text)
        # the typescript file can omit a type completely like "property foo;"
        type =
          if node.type
            parseType(node.type)
          else
            new UnknownType()
        accumulateProperties.push(new Property(node.name.text, type))
      when ts.SyntaxKind.MethodDeclaration, ts.SyntaxKind.MethodSignature
        console.log("  method " + node.name.text)
      when ts.SyntaxKind.Constructor, ts.SyntaxKind.ConstructSignature
        console.log("  constructor " + JSON.stringify(node.parameters.map((p) -> p.name.text)))
      when ts.SyntaxKind.Identifier
        console.log("  class identifier " + node.text)
      when ts.SyntaxKind.TypeParameter
        console.log("  class has type parameter " + node.symbol?.text)
      when ts.SyntaxKind.CallSignature
        ; # example: (value: T, index: number): U
      else
        report(node, "unhandled child of class " + className)

    false # do not abort foreach

  parseModuleChild = (moduleName, node, accumulateSubmodules, accumulateClasses) ->
    switch node.kind
      when ts.SyntaxKind.ClassDeclaration, ts.SyntaxKind.InterfaceDeclaration
        console.log("class=" + node.name.text)
        supers = []
        methods = []
        properties = []
        ts.forEachChild(node, (child) -> parseClassChild(node.name.text, child, supers, methods, properties))
        c =
          if node.kind == ts.SyntaxKind.ClassDeclaration
            new Class(node.name.text, supers, methods, properties)
          else
            new Interface(node.name.text, supers, methods, properties)
        accumulateClasses.push(c)
      when ts.SyntaxKind.ModuleDeclaration
        console.log("moduledecl=" + node.name.text)
      when ts.SyntaxKind.FunctionDeclaration
        console.log("function=" + node.name.text)
      when ts.SyntaxKind.EnumDeclaration
        console.log("enum=" + node.name.text)
      when ts.SyntaxKind.ImportEqualsDeclaration
        ; # example: import Size = utility.Size
      when ts.SyntaxKind.VariableStatement
        ; # example: var IShellView: Token<IShellView>;
      when ts.SyntaxKind.TypeAliasDeclaration
        ; # example: type FactoryChild = (string | Elem) | (string | Elem)[];
      else
        report(node, "unhandled child of module " + moduleName)

    false # do not abort foreach

  parseModules = (node, accumulateModules) ->
    switch node.kind
      when ts.SyntaxKind.ModuleDeclaration
        console.log("  module " + node.name.text)
        submodules = []
        classes = []
        switch node.body.kind
          when ts.SyntaxKind.ModuleBlock
            ts.forEachChild(node.body, (child) -> parseModuleChild(node.name.text, child, submodules, classes))
          when ts.SyntaxKind.ModuleDeclaration
            parseModules(node.body, submodules)
          else
            throw new Error("Unexpected module body " + node.body)

        accumulateModules.push(new Module(node.name.text, submodules, classes))
      when ts.SyntaxKind.EndOfFileToken
        console.log("EOF")
      else
        report(node, "unhandled child at root")

    false # do not abort foreach

  modules = []

  ts.forEachChild(sourceFile, (n) -> parseModules(n, modules))

  coalesceModules(modules)

buildPymodelsFromFile = (file, config) ->
  contents = file._contents.toString('utf-8')
  modules = parseFile(file.path, contents)

  # TODO write out python files don't just log
  dumpModule = (module) ->
    console.log(module.toString())
    for c in module.classes
      console.log("  " + c.toString())
      for p in c.properties
        console.log("    " + p.toString())
    for s in module.submodules
      dumpModule(s)
  for m in modules
    dumpModule(m)

buildPymodels = through 'buildPymodels', buildPymodelsFromFile, {}

gulp.task "phosphor:pymodels", ->

  gulp.src paths.phosphorTypes.sources
   .pipe(buildPymodels())

