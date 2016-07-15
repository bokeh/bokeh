<label for="<%= @id %>"> <%= @title %> </label>
<select multiple class="bk-widget-form-input" id="<%=@id %>" name="<%= @name %>">
  <% for option in @options: %>
    <% if typeof option is "string": %>
  <option <% if @value.indexOf(option) > -1: %>selected="selected" <% end %>value="<%= option %>"><%=option%></option>
    <% else: %>
  <option  <% if @value.indexOf(option[0]) > -1: %>selected="selected" <% end %>value="<%= option[0] %>"><%= option[1] %></option>
    <% end %>
  <% end %>
</select>