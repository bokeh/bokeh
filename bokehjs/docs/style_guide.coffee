# ### Coffeescript Style Guide for BokehJS

# #### General guidelines
# * 2 spaces per indent
# * 80 characters per line

# #### Names

# Use underscores ('snake case') for variable names
foo = 10
some_thing = 20

# ...for function names
my_func = (a, b) ->

# ...and for method names
class Foo
  my_method: (foo) ->

# Use CamelCase ('CapWords') for class names
class SomeThing extends Backbone.Model

# Use initial underscore to mark "private" methods and attribute in classes
class Foo
  public_method: () ->
    console.log('a public method')
    @_private_method() # OK to call from another method

  _private_method: () ->
    console.log('should only be called by other methods of this class')

  _private_attr = 10 # should not be accessed outside methods

# #### Functions

# Always use parentheses around function calls
console.log('call me like this')

# i.e., **don't** do this:
console.log 'not like this'

# Always use parenthesis when defining a function:
foo = (a, b, c) ->

# Even if there are no arguments:
foo = () ->

# For inline functions definitions, use 4 spaces before the start of the
# function definition and 2 spaces before the comma separating function arguments:
some_foo(1, 2, 3,
    () ->
      my_callback_goes_here()
      a =
        'node': 'fast'
      return a
  ,
    () ->
      second_callback_goes_here()
)

# Always return something, or null (do not rely on CoffeeScript's implicit return value)
foo = () ->
  a = 10
  return null

# **don't** do this:
foo = () ->
  a = 10

# #### Object Literals

# OK to omit braces for object literals that are standalone
obj =
  coffee: 'black'
  cream: 'none'
  bagels:
    cream_cheese: 'fat_free'
    toasted: 'of course'

# In function calls, prefer to put braces around object literals
foo({'name': 'John Doe', 'title': 'coder'})

# Note: object literals in function calls which do NOT fit in one line can be tricky.
# This won't compile:
#
# ```
# foo({'name': 'firstobject',
#   'title': 'first'})
# ```
foo({
  'foo': 10,
  'bar': 20,
})




