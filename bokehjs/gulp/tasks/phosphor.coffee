# build phosphor-related stuff

gulp = require "gulp"
ts = require "typescript"
through = require "gulp-through"
savefile = require "gulp-savefile"

paths = require "../paths"
utils = require "../utils"

class Module
  constructor: (@name, @submodules, @classes, @enums) ->

  toString: () ->
    "Module(#{@name})"

  _lookup: (identifier) ->
    for c in @classes
      if c.name == identifier
        return c
    for e in @enums
      if e.name == identifier
        return e
    # this just scans all the submodules too,
    # so if the name is in two different modules,
    # we could get the wrong one. For now hoping
    # there aren't actual naming conflicts that
    # we care about, if there were we'd have to
    # get more complex.
    for s in @submodules
      inSub = s._lookup(identifier)
      if inSub
        return inSub
    return null

  resolveIdentifiers: (lookup) ->
    if not lookup
      # is this syntax really the right way to get a bound method?
      lookup = (id) => @_lookup(id)

    for s in @submodules
      s.resolveIdentifiers(lookup)
    for c in @classes
      c.resolveIdentifiers(lookup)

  concat: (otherModule) ->
    @submodules = @submodules.concat(otherModule.submodules)
    @classes = @classes.concat(otherModule.classes)
    @enums = @enums.concat(otherModule.enums)

# TODO use this below in toPython to avoid listing
# superclasses that are redundant (because one
# superclass is already a parent of another,
# notably IShellView is already a Widget but
# ShellView inherits both IShellView and Widget,
# we need to drop Widget)
inheritsFrom = (a, b) ->
  for h in a.heritage
    if h.name == b.name
        return true
    if h.resolved and inheritsFrom(h.resolved, b)
        return true

  return false

class ClassOrInterface

  resolveIdentifiers: (lookup) ->
    for h in @heritage
      h.resolveIdentifiers(lookup)
    for m in @methods
      m.resolveIdentifiers(lookup)
    for p in @properties
      p.resolveIdentifiers(lookup)

  toPython: () ->
    # we have to fix up inheritance to avoid
    # something like "Super, SubOfSuper" because
    # python doesn't allow that.
    deduplicated = []
    for h in @heritage
      redundant = false
      # h is redundant if any o inherits from it
      for o in @heritage
        if h.name != o.name
          if o.resolved and h.resolved and inheritsFrom(o.resolved, h.resolved)
            redundant = true
      if not redundant
        deduplicated.push(h)

    pyparents = null
    if deduplicated.length == 0
      pyparents = "PlotObject"
    else
      pyparents = deduplicated.map((h) -> h.name).join()
    pyproperties =
      (@properties.map (prop) -> "    " + prop.toPython()).join("\n")

    """
class #{@name}(#{pyparents}):

    __view_model__ = 'phosphor_#{@name}'

#{pyproperties}

    def __init__(self, **kwargs):
        super(#{@name}, self).__init__(**kwargs)

    """

class Class extends ClassOrInterface
  constructor: (@name, @heritage, @methods, @properties) ->

  toString: () ->
    "Class(#{@name} extends #{@heritage})"

class Interface extends ClassOrInterface
  constructor: (@name, @heritage, @methods, @properties) ->

  toString: () ->
    "Interface(#{@name} extends #{@heritage})"

class Method
  constructor: (@name, @parameters, @returnValue) ->

  toString: () ->
    "Method(#{@name})"

  resolveIdentifiers: (lookup) ->
    for p in @parameters
      p.resolveIdentifiers(lookup)
    @returnValue.resolveIdentifiers(lookup)

class Property
  constructor: (@name, @type) ->

  toString: () ->
    "Property(#{@name}: #{@type})"

  _typeAsSpec: (type) ->
    if type.name
      switch type.name
        when "number"
          """Float(help="")"""
        when "boolean"
          """Bool(help="")"""
        when "string"
          """String(help="")"""
        when "any"
          """Any(help="")"""
        else
          if type.resolved
            if type.resolved instanceof Enum
              """Enum(#{type.name})"""
            else
              """Instance("#{type.name}")"""
          else
            null
    else if type instanceof ArrayType
      elemSpec = @_typeAsSpec(type.elementType)
      if elemSpec
        """List(#{elemSpec})"""
      else
        null
    else
      null

  toPython: () ->
    if @type.nodeKind and @type.nodeKind == ts.SyntaxKind.FunctionType
      """# omitted function-valued property #{@name}"""
    else if '$' in @name
      """# omitted property with a $ in it  #{@name}"""
    else
      spec = @_typeAsSpec(@type)
      if spec
        """#{@name} = #{spec}"""
      else if @type instanceof IdentifierType and (@type.name == "T" or @type.name == "U")
        """#{@name} = Any() # generic property with type #{@type.name}"""
      else if @type instanceof IdentifierType and (@type.name == "HTMLElement")
        # HTMLElement or other DOM types like that
        """# omitted property #{@name} with external type #{@type.name}"""
      else if @type instanceof IdentifierType and (@type.name == "ElemTag")
        """# omitted property #{@name} with unhandled type alias type #{@type.name}"""
      else
        throw new Error("Unhandled or unresolved property type " + @type)

  resolveIdentifiers: (lookup) ->
    @type.resolveIdentifiers(lookup)

class Type
  resolveIdentifiers: (lookup) ->

class UnknownType extends Type
  constructor: (@nodeKind) ->

  toString: () ->
    "UnknownType(#{ts.SyntaxKind[@nodeKind]})"

class PrimitiveType extends Type
  constructor: (@name) ->

  toString: () ->
    "PrimitiveType(#{@name})"

class IdentifierType extends Type
  constructor: (@name) ->
    @resolved = null
    if not @name
      throw new Error("No name passed to IdentifierType")

  toString: () ->
    "IdentifierType(#{@name})"

  resolveIdentifiers: (lookup) ->
    @resolved = lookup(@name)

class ArrayType extends Type
  constructor: (@elementType) ->
    if not @elementType
      throw new Error("No elementType passed to ArrayType")

  toString: () ->
    "ArrayType(#{@elementType})"

  resolveIdentifiers: (lookup) ->
    @elementType.resolveIdentifiers(lookup)

class Parameter
  constructor: (@name, @type) ->

  toString: () ->
    "Parameter(#{@name}: #{@type})"

  resolveIdentifiers: (lookup) ->
    @type.resolveIdentifiers(lookup)

class Enum
  constructor: (@name, @values) ->

  toString: () ->
    "Enum(#{@name})"

coalesceModules = (modules) ->
  sorted = modules.concat([]).sort((a,b) -> a.name.localeCompare(b.name))
  coalesced = []
  for m in sorted
    last = null
    if coalesced.length > 0
      last = coalesced[coalesced.length - 1]
    if last and last.name == m.name
      last.concat(m)
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

  textFromEntityName = (node) ->
    if node.right
      # node.left has the qualifiers (module scope)
      # which we're ignoring for now
      node.right.text
    else
      node.text

  parseType = (node) ->
    switch node.kind
      when ts.SyntaxKind.ArrayType
        new ArrayType(parseType(node.elementType))
      when ts.SyntaxKind.TypeReference
        # could be a class name or a generic parameter
        if not node.typeName
          report(node, "No typeName for TypeReference")
        new IdentifierType(textFromEntityName(node.typeName))
      when ts.SyntaxKind.FunctionType
        new UnknownType(node.kind)
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

  isPrivate = (node) ->
    if not node.modifiers
      false
    else
      for m in node.modifiers
        if m.kind == ts.SyntaxKind.PrivateKeyword
          return true
      false

  isStatic = (node) ->
    if not node.modifiers
      false
    else
      for m in node.modifiers
        if m.kind == ts.SyntaxKind.StaticKeyword
          return true
      false

  parseClassChild = (className, node, accumulateSupers, accumulateMethods, accumulateProperties) ->
    switch node.kind
      when ts.SyntaxKind.HeritageClause
        parseHeritage(node, accumulateSupers)
      when ts.SyntaxKind.PropertyDeclaration, ts.SyntaxKind.PropertySignature
        console.log("  property " + node.name.text)
        if isPrivate(node)
          console.log("    (private)")
        else if isStatic(node)
          console.log("    (static)")
        else
          # the typescript file can omit a type completely like "property foo;"
          type =
            if node.type
              parseType(node.type)
            else
              new UnknownType(ts.SyntaxKind.AnyKeyword)
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

  parseModuleChild = (moduleName, node, accumulateSubmodules, accumulateClasses, accumulateEnums) ->
    switch node.kind
      when ts.SyntaxKind.ClassDeclaration, ts.SyntaxKind.InterfaceDeclaration
        console.log("class=" + node.name.text)
        if isPrivate(node)
          console.log("  (private)")
        else
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
        values = []
        values = node.members.map((m) -> m.name.text)
        accumulateEnums.push(new Enum(node.name.text, values))
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
        enums = []
        switch node.body.kind
          when ts.SyntaxKind.ModuleBlock
            ts.forEachChild(node.body, (child) -> parseModuleChild(node.name.text, child, submodules, classes, enums))
          when ts.SyntaxKind.ModuleDeclaration
            parseModules(node.body, submodules)
          else
            throw new Error("Unexpected module body " + node.body)

        accumulateModules.push(new Module(node.name.text, submodules, classes, enums))
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

  for m in modules
    m.resolveIdentifiers()

  allClasses = []
  allEnums = []
  dumpModule = (module) ->
    if module.name == 'virtualdom' or module.name == 'collections'
      console.log("Skipping module " + module.name)
      return

    #console.log(module.toString())
    for c in module.classes
      allClasses.push(c)
      #console.log("  " + c.toString())
      #for p in c.properties
      #  console.log("    " + p.toString())
    for e in module.enums
      allEnums.push(e)
      #console.log("  " + e.toString())
    for s in module.submodules
      dumpModule(s)
  for m in modules
    dumpModule(m)

  # sort classes so that supers are before subs
  # since Python needs it that way.
  # There's an issue when we have circular references
  # between classes though.

  alreadyPlaced = {}
  orderedClasses = []
  place = (c) ->
    if c.name of alreadyPlaced
      ;
    else
      alreadyPlaced[c.name] = 1

      # Place superclasses first in the list
      for h in c.heritage
        if h.resolved
          place(h.resolved)

      placeType = (type) ->
        if type.resolved and not (type.resolved instanceof Enum)
          place(type.resolved)

      # we also need any types we reference for props, parameters
      # to come before us
      for p in c.properties
        placeType(p.type)

        if p.type instanceof ArrayType
          placeType(p.type.elementType)

      # TODO: methods, constructors need to
      # handle their parameters here

      # finally push the class itself
      orderedClasses.push(c)

  for c in allClasses
    place(c)

  if allClasses.length != orderedClasses.length
    console.log("#{allClasses.length} allClasses:\n", allClasses.map((c) -> c.name).join("\n"))
    console.log("#{orderedClasses.length} orderedClasses:\n", orderedClasses.map((c) -> c.name).join("\n"))
    throw new Error("We messed up reordering the classes somehow")

  allClasses = orderedClasses

  # generate the Python

  builder = ""
  append = (s) ->
    builder = builder + s + "\n"
  append("# file automatically-generated by `gulp phosphor:pymodels`, do not edit by hand")
  append("from __future__ import absolute_import")
  append("from ...plot_object import PlotObject")
  append("from ...properties import *")
  append("del globals()['Size']") # fix a namespace collision
  append("from ...enums import enumeration")
  append("")
  for e in allEnums
    values = e.values.map((v) -> "\"#{v}\"").join(", ")
    append("#{e.name} = enumeration(#{values})")
  append("")
  for c in allClasses
    append(c.toPython())

  #file.cwd = ""
  #file.base = ""
  file.path = "phosphor.py"
  file.contents = new Buffer(builder)

buildPymodels = through 'buildPymodels', buildPymodelsFromFile, {}

gulp.task "phosphor:pymodels", ->

  gulp.src paths.phosphorTypes.sources
   .pipe(buildPymodels())
   .pipe(savefile())
