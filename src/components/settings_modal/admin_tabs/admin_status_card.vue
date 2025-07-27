<template>
  <div class="setting-item">
    <h2> {{ $t('admin_dash.users.title_info') }}: </h2>
    <span> {{ $t('admin_dash.users.status_id') }}: {{ statusDetails.id }} </span>
    <span> {{ $t('admin_dash.users.created_at') }}: {{ statusDetails.created_at }} </span>
    <span v-if="typeof(statusDetails.edited_at) !== 'undefined'"> {{ $t('admin_dash.users.edited_at') }}: {{ statusDetails.edited_at }} </span>
    <h2> {{ $t('admin_dash.users.title_content') }}: </h2>
    <div>
      <StatusBody
        v-if="typeof(statusCache) !== 'undefined'"
        :status="statusCache"
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
    <a :href="statusDetails.url"> {{ $t('admin_dash.users.link_source') }} </a>
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
      <h2> details </h2>
      <pre> {{ JSON.stringify(statusDetails, null, 2) }} </pre>
    </div>
  </div>
</template>

<script src="./admin_status_card.js"></script>
