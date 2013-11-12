Eco: Embedded CoffeeScript templates
====================================

Eco lets you embed [CoffeeScript](http://coffeescript.org/) logic in
your markup. It's like EJS and ERB, but with CoffeeScript inside the
`<% ... %>`. Use it from [Node.js](http://nodejs.org/) to render your
application's views.

Here's an Eco template:

    <% if @projects.length: %>
      <% for project in @projects: %>
        <a href="<%= project.url %>"><%= project.name %></a>
        <p><%= project.description %></p>
      <% end %>
    <% else: %>
      No projects
    <% end %>


### Installation

Eco requires:

* [Node.js](http://nodejs.org/) >= 0.2.0
* [CoffeeScript](http://coffeescript.org/) >= 0.9.4
* [strscan](http://github.com/sstephenson/strscan-js) >= 1.0.0

The easiest way to install Eco is via [npm](http://github.com/isaacs/npm):

    $ npm install eco


### Usage

Use `eco.render()` to render your templates. The first argument is the
template source as a string. The second argument is the context object
which contains your view state and any helper methods you want to call.

    eco = require "eco"
    fs  = require "fs"

    template = fs.readFileSync __dirname + "/views/projects.html.eco", "utf-8"
    console.log eco.render template, projects: [
      { name: "Mobile app", url: "/projects/1", description: "Iteration 1" },
      { name: "Home page redesign", url: "/projects/2" }
    ]

Eco is fully synchronous. If your template needs to access data from
asynchronous operations, perform those first before calling `render`.


### Quick reference

* `<% expression %>`: Evaluate a CoffeeScript expression without
  printing its return value.
* `<%= expression %>`: Evaluate a CoffeeScript expression, escape its
  return value, and print it.
* `<%- expression %>`: Evaluate a CoffeeScript expression and print
  its return value without escaping it.
* `<%= @property %>`: Print the escaped value of the property
  `property` from the context object passed to `render`.
* `<%= @helper() %>`: Call the helper method `helper` from the context
  object passed to `render`, then print its escaped return value.


### A note about whitespace

Since CoffeeScript is whitespace-sensitive, but your templates aren't,
Eco code tags that begin an indented CoffeeScript block are suffixed
with a colon. To indicate the end of an indented block, use the
special tag `<% end %>`. For example:

    <% if @project.isOnHold(): %>
      On Hold
    <% end %>

You don't need to write the `if` and `end` tags on separate lines:

    <% if @project.isOnHold(): %> On Hold <% end %>

And you can use the single-line postfix form of `if` as you'd expect:

    <%= "On Hold" if @project.isOnHold() %>

Certain forms in CoffeeScript, such as `else`, must be unindented
first. Eco handles that for you automatically:

    <% if @project.isOnHold(): %>
      On Hold
    <% else if @project.isArchived(): %>
      Archived
    <% end %>


### The context object

The context object you pass to `eco.render()` becomes the value of
`this` inside your template. You can use CoffeeScript's `@` sigil to
easily access properties and call helper methods on the context
object.

    eco.render "<p><%= @description %></p>",
      description: "HTML 5 mobile app"


### Helpers

Helper methods on your context object can access other properties on
the context object in the same way they're accessed in the template:
through `this`, or with the `@` sigil.

    translations = require "translations"

    eco.render "<span><%= @translate 'common.welcomeText' %></span>",
      language:  "en"
      translate: (key) ->
        translations[@language][key]


### Escaping and unescaping

When you print an expression in a template with `<%= ... %>`, its
value is HTML-escaped. For example,

    eco.render "<%= @description %>",
      description: "<strong>HTML 5</strong> mobile app"

would render:

    &lt;strong&gt;HTML 5&lt;/strong&gt; mobile app

You can use the `<%- ... %>` tag to print the value of an expression
without escaping it. So this code:

    eco.render "<%- @description %>",
      description: "<strong>HTML 5</strong> mobile app"

would produce:

    <strong>HTML 5</strong> mobile app

It is sometimes useful to generate markup in helper methods. The
special `safe` method on the context object tells Eco that the string
can be printed in `<%= ... %>` tags without being escaped. You can use
this in conjunction with the context object's `escape` method to
selectively sanitize parts of the string. For example,

    eco.render "<%= linkTo @project %>",
      project: { id: 4, name: "Crate & Barrel" }
      linkTo: (project) ->
        url  = "/projects/#{project.id}"
        name = @escape project.name
        @safe "<a href='#{url}'>#{name}</a>"

would render:

    <a href='/projects/4'>Crate &amp; Barrel</a>


### Custom `escape` helpers

By default, Eco's `escape` method takes a string and returns an
HTML-escaped string. You can override this behavior to escape for
formats other than HTML, or to bypass escaping entirely. For example,

    eco.render "From: <%= @address %>",
      address: "Sam Stephenson <sstephenson@gmail.com>"
      escape:  (string) -> string      

would return:

    From: Sam Stephenson <sstephenson@gmail.com>


### Blocks and capturing

You can capture blocks of a template by wrapping them in a function
definition. For example, rendering this template:

    <% div = (contents) => %>
       <div><%- contents %></div>
    <% end %>
    <%= div "Hello" %>

would produce:

    <div>Hello</div>

Captured blocks can be passed to helper methods too. In this example,
the capture body is passed to the `formFor` helper as its last
argument. Then the `formFor` helper calls this argument to produce a
value.

    template = """
      <%= @formFor @project, (form) => %>
        <label>Name:</label>
        <%= form.textField "name" %>
      <% end %>
    """

    eco.render template,
      project: { id: 1, name: "Mobile app" }
      formFor: (project, yield) ->
        form =
          textField: (attribute) =>
            name  = @escape attribute
            value = @escape @project[attribute]
            @safe "<input type='text' name='#{name}' value='#{value}'>"

        url  = "/projects/#{@project.id}"
        body = yield form
        @safe "<form action='#{url}' method='post'>#{body}</form>"

Note: In general, you should use CoffeeScript's fat arrow (`=>`) to
define capturing functions, so that you have access to the context
object inside the captured block. Treat the plain arrow (`->`) as an
optimization, for when you are certain the capture body will not need
to reference properties or helper methods on the context object.


### Contributing

You can check out the Eco source code from GitHub:

    $ git clone http://github.com/sstephenson/eco.git

To run Eco's test suite, install
[nodeunit](http://github.com/caolan/nodeunit) and run `cake test`.

Report bugs on the [GitHub issue tracker](http://github.com/sstephenson/eco/issues).


### License (MIT)

Copyright (c) 2010 Sam Stephenson <sstephenson@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


### Special thanks

* Jeremy Ashkenas <jashkenas@gmail.com>
* Josh Peek <josh@joshpeek.com>
