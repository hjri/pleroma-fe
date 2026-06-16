<template>
  <div class="Lists panel panel-default">
    <div class="panel-heading">
      <div class="title">
        <h1 class="title">
          {{ $t('lists.lists') }}
        </h1>
      </div>
      <router-link
        :to="{ name: 'lists-new' }"
        class="button-default btn new-list-button"
      >
        {{ $t("lists.new") }}
      </router-link>
    </div>
    <div class="panel-body">
      <FolderCard
        v-for="list in lists.slice().reverse()"
        :key="list"
        :name="list.title"
        :link="{ name: 'lists-timeline', params: { id: list.id } }"
        :link-edit="{ name: 'lists-edit', params: { id: list.id } }"
        class="list-item"
      />
    </div>
  </div>
</template>

<script src="./lists.js"></script>

<style lang="scss">
.Lists {
  .new-list-button {
    padding: 0 0.5em;
  }
}
</style>
