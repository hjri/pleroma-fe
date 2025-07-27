<template>
  <div class="setting-item">
    <h2> {{ $t('admin_dash.users.title_info') }}: </h2>
    <span> {{ $t('admin_dash.users.status_id') }}: {{ status_details.id }} </span>
    <span> {{ $t('admin_dash.users.created_at') }}: {{ status_details.created_at }} </span>
    <span v-if="typeof(status_details.edited_at) !== 'undefined'"> {{ $t('admin_dash.users.edited_at') }}: {{ status_details.edited_at }} </span>
    <h2> {{ $t('admin_dash.users.title_content') }}: </h2>
    <div>
      <StatusBody
        v-if="typeof(status_cache) !== 'undefined'"
        :status="status_cache"
      />
    </div>
    <button
      class="button button-default btn"
      type="button"
      @click="delete_status(status.id)"
    >
      {{ $t('admin_dash.users.delete_status') }}
    </button><br>
    <Checkbox
      :model-value="is_sensitive"
      @update:model-value="v => change_sensitivity(v)"
    >
      {{ $t('admin_dash.users.content_nsfw') }}
    </Checkbox>
    <Select
      :model-value="visibility"
      @update:model-value="v => change_visibility(v)"
    >
      <option
        value="public"
      >
        {{ $t('admin_dash.users.scope_public') }}
      </option>
      <option
        value="unlisted"
      >
        {{ $t('admin_dash.users.scope_unlisted') }}
      </option>
      <option
        value="private"
      >
        {{ $t('admin_dash.users.scope_private') }}
      </option>
      <option
        value="direct"
      >
        {{ $t('admin_dash.users.scope_direct') }}
      </option>
    </Select><br>
    <a :href="status_details.url"> {{ $t('admin_dash.users.link_source') }} </a>
    <div v-if="!json_expanded">
      <button
        class="button button-default btn"
        type="button"
        @click="json_expanded = !json_expanded"
      >
        {{ $t('admin_dash.users.expand_raw_info') }}
      </button>
    </div>
    <div v-else>
      <button
        class="button button-default btn"
        type="button"
        @click="json_expanded = !json_expanded"
      >
        {{ $t('admin_dash.users.collapse_raw_info') }}
      </button>
      <h2> {{ $t('admin_dash.users.title_details') }} </h2>
      <pre> {{ JSON.stringify(status_details, null, 2) }} </pre>
    </div>
  </div>
</template>

<script src="./admin_status_card.js"></script>
