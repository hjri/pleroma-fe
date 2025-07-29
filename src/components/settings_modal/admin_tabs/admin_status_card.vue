<template>
  <div class="setting-item">
    <h2> {{ $t('admin_dash.users.title_info') }}: </h2>
    <ul
      class="setting-list"
    >
      <li>
        <span> {{ $t('admin_dash.users.status_id') }}: {{ status_details.id }} </span>
      </li>
      <li>
        <span> {{ $t('admin_dash.users.created_at') }}: {{ new Date(status_details.created_at).toLocaleString() }} </span>
      </li>
      <li>
        <span v-if="status_details.edited_at !== null"> {{ $t('admin_dash.users.edited_at') }}: {{ new Date(status_details.edited_at).toLocaleString() }} </span>
      </li>
    </ul>
    <h2> {{ $t('admin_dash.users.title_content') }}: </h2>
    <ul
      class="setting-list"
    >
      <li>
        <Status
          v-if="typeof(status_cache) !== 'undefined'"
          class="Notification"
          :compact="true"
          :statusoid="status_cache"
          @interacted="false"
        />
      </li>
      <li>
        <button
          class="button button-default btn"
          type="button"
          @click="delete_status(status.id)"
        >
          {{ $t('admin_dash.users.delete_status') }}
        </button>
      </li>
      <li>
        <Checkbox
          :model-value="is_sensitive"
          @update:model-value="v => change_sensitivity(v)"
        >
          {{ $t('admin_dash.users.content_nsfw') }}
        </Checkbox>
      </li>
      <li>
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
        </Select>
      </li>
      <li>
        <a :href="status_details.url"> {{ $t('admin_dash.users.link_source') }} </a>
      </li>
    </ul>
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
