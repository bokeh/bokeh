<ul class="bk-bs-nav bk-bs-nav-tabs">
  <% for tab, i in @tabs: %>
    <li class="<%= @active(i) %>">
      <a href="#tab-<%= tab.id %>"><%= tab.title %></a>
    </li>
  <% end %>
</ul>
<div class="bk-bs-tab-content">
  <% for tab, i in @tabs: %>
    <div class="bk-bs-tab-pane <%= @active(i) %>" id="tab-<%= tab.id %>"></div>
  <% end %>
</div>
