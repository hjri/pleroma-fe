<template>
  <div class="setting-item">
    <h2> {{ $t('admin_dash.users.title_info') }}: </h2>
    <ul
      class="setting-list"
    >
      <li>
        <span> {{ $t('admin_dash.users.status_id') }}: {{ statusDetails.id }} </span>
      </li>
      <li>
        <span> {{ $t('admin_dash.users.created_at') }}: {{ new Date(statusDetails.created_at).toLocaleString() }} </span>
      </li>
      <li>
        <span v-if="statusDetails.edited_at !== null"> {{ $t('admin_dash.users.edited_at') }}: {{ new Date(statusDetails.edited_at).toLocaleString() }} </span>
      </li>
    </ul>
    <h2> {{ $t('admin_dash.users.title_content') }}: </h2>
    <ul
      class="setting-list"
    >
      <li>
        <Status
          v-if="typeof(statusCache) !== 'undefined'"
          class="Notification"
          :compact="true"
          :statusoid="statusCache"
          @interacted="false"
        />
      </li>
      <p> action dropdown thingy </p>
      <!--
      <li>
        <button
          class="button button-default btn"
          type="button"
          @click="deleteStatus(status.id)"
        >
          {{ $t('admin_dash.users.delete_status') }}
        </button>
      </li>
      <li>
        <Checkbox
          :model-value="isSensitive"
          @update:model-value="v => changeSensitivity(v)"
        >
          {{ $t('admin_dash.users.content_nsfw') }}
        </Checkbox>
      </li>
      <li>
        <Select
          :model-value="visibility"
          @update:model-value="v => changeVisibility(v)"
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
        <a :href="statusDetails.url"> {{ $t('admin_dash.users.link_source') }} </a>
      </li>
      -->
    </ul>
    <!--
    <div v-if="!jsonExpanded">
      <button
        class="button button-default btn"
        type="button"
        @click="jsonExpanded = !jsonExpanded"
      >
        {{ $t('admin_dash.users.expand_raw_info') }}
      </button>
    </div>
    <div v-else>
      <button
        class="button button-default btn"
        type="button"
        @click="jsonExpanded = !jsonExpanded"
      >
        {{ $t('admin_dash.users.collapse_raw_info') }}
      </button>
      <h2> {{ $t('admin_dash.users.title_details') }} </h2>
      <pre> {{ JSON.stringify(statusDetails, null, 2) }} </pre>
    </div>
    -->
  </div>
</template>

<script src="./admin_status_card.js"></script>
