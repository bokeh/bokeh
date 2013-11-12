{preprocess} = require "eco/preprocessor"
{fixture}    = require "fixtures"

module.exports =
  "preprocessing fixtures/hello.eco": (test) ->
    test.same fixture("hello.coffee"), preprocess fixture("hello.eco")
    test.done()

  "preprocessing fixtures/projects.eco": (test) ->
    test.same fixture("projects.coffee"), preprocess fixture("projects.eco")
    test.done()

  "preprocessing fixtures/helpers.eco": (test) ->
    test.same fixture("helpers.coffee"), preprocess fixture("helpers.eco")
    test.done()

  "unexpected dedent": (test) ->
    test.expect 1
    try
      preprocess """
        <% if item = @items?[0]: %>
          <%= item.price %>
          <% end %>
        <% end %>
      """
    catch err
      test.same "Parse error on line 4: unexpected dedent", err.toString()
    test.done()

  "unexpected newline in code block": (test) ->
    test.expect 1
    try
      preprocess """
        <%= item.price if
              item = @items?[0] %>
      """
    catch err
      test.same "Parse error on line 1: unexpected newline in code block", err.toString()
    test.done()

  "unexpected end of template": (test) ->
    test.expect 1
    try
      preprocess "<%= item.price"
    catch err
      test.same "Parse error on line 1: unexpected end of template", err.toString()
    test.done()

  "automatic captures use the same arrow as the function definition": (test) ->
    output = preprocess "<% @foo -> %><br><% end %>"
    test.ok output.match /capture ->/

    output = preprocess "<% @foo => %><br><% end %>"
    test.ok output.match /capture =>/

    test.done()

  "'end' dedents properly after an automatic capture": (test) ->
    output = preprocess """
      <ul>
      <% @getItems (items) -> %>
        <% for item in items: %>
        <li><%= item.name %></li>
        <% end %>
      <% end %>
      </ul>
    """

    lines = output.split("\n")
    test.same "", lines.pop()
    test.ok lines.pop().match(/^\S/)
    test.done()

