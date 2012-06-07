"""
start of continuum CS style guide. our code does not follow this yet.
"""
"""
2 spaces per indent
80 characters per line
"""

"""
underscores to separate variables names
CamelCase for class names
underscores preceding functions show what we think is private
coffeescript makes it easy to pass instance methods as callbacks.
try to use that instead of writing lots of inline functions as callbacks
"""
class MyBigClass extends Backbone.Model
  set_my_field : () ->
    @set('hello')
    super()

  _dont_call_func : () ->
    console.log('you should not be calling this')

  call_func : () ->
    console.log('but I can call this func, because I am in this class')
    @_dont_call_func()

"""
coffee script looseness
ALWAYS use parentheses around function calls
"""

console.log('log this statement')

# don't do this

console.log 'logging this message'

# it is ok to omit braces when using object literals,
# as long as that is the only thing happening there.
foo =
  coffee : 'black'
  cream : 'none'
  bagels :
    cream_cheese : 'fat_free'
    toasted : 'of course'

# in more complex situations, this is not ok.
# For inline object literals which fit on one line, use braces
foo({'name' : 'firstobject', 'title' : 'first'},
  {'name' : 'second object', 'title' : 'first'})

# object literals in function calls which do NOT fit in one line are tricky
# this won't compile!!
# foo({'name' : 'firstobject',
#   'title' : 'first'})


# this will, as you can see, whitespace is too important.
# the braces are actually not very useful.
foo(
  {
    'name' : 'second object',
    'title' : 'first'
  },{
    'name' : 'second object',
    'title' : 'first'
  })

# I think multi line object literals within functions should NOT use braces, but
# instead, careful whitespacing should make it very obvious what is going on
# NOTE, there are 4 spaces preceing 'name', and 2 spaces before the comma
# also note, there are NO commas in the object
foo(
    'name' : 'second object'
    'title' : 'first'
  ,
    'name' : 'second object'
    'title' : 'first'
  ,
    [1, 2,
    3, 4, 5]
)

#the parsing for inline arrays  is more robust

"""
inline functions
we follow the same syntax for object arrays.  4 spaces before the start of the
function definition.  2 spaces before the comma separating the functions
"""
foo(1, 2, 3,
    () ->
      my_callback_goes_here()
      a =
        'node' : 'fast'
      return a
  ,
    () ->
      second_callback_goes_here()
)

"""
return values
coffee script always returns the last value in a function.  don't rely on this.
always return something, or null
"""

