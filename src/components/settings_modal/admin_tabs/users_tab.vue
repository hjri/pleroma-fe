<template>
  <div :label="$t('admin_dash.tabs.instance')">
    <UserList
      :refresh="true"
      :get-key="i => i"
      :boxOnly="true"
    >
      <template #item="{item}">
        <AdminCard :userId="item.id" />
      </template>
    </UserList>
  </div>
</template>
<script src="./users_tab.js"></script>
