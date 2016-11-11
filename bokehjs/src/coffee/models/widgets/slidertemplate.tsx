<div class="bk-slider-parent">
  <% if @title?: %>
    <% if @title.length != 0: %>
      <label for="<%= @id %>"> <%= @title %>: </label>
    <% end %>
    <input type="text" id="<%= @id %>" readonly>
  <% end %>
  <div class="bk-slider-<%= @orientation %>">
    <div class="slider" id="<%= @id %>"></div>
  </div>
</div>
