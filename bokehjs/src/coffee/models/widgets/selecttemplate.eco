<label for="<%= @id %>"> <%= @title %> </label>
<select class="bk-widget-form-input" id="<%= @id %>" name="<%= @name %>">
  <% for option in @options: %>
    <% if typeof option is "string": %>
      <option <%= if option == @value: %>selected="selected"<% end %> value="<%= option %>"><%= option %></option>
    <% else: %>
      <option <%= if option[0] == @value: %>selected="selected"<% end %> value="<%= option[0] %>"><%= option[1] %></option>
    <% end %>
  <% end %>
</select>
