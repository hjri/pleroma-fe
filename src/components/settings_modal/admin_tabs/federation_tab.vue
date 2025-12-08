<template>
  <div :label="$t('admin_dash.tabs.federation')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.federation.global') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:instance.:federating" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:skip_thread_containment" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:external_user_synchronization" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.federation.restrictions') }}</h3>
      <ul class="setting-list">
        <li>
          <MapSetting path=":pleroma.:instance.:quarantined_instances" />
        </li>
        <li>
          <MapSetting path=":pleroma.:instance.:rejected_instances" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.federation.activitypub') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:instance.:allow_relay" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:activitypub.:unfollow_blocked" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:activitypub.:outgoing_blocks" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:activitypub.:blockers_visible" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:activitypub.:follow_handshake_timeout" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:activitypub.:note_replies_output_limit" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:instance.:federation_incoming_replies_max_depth" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:instance.:federation_reachability_timeout_days" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:allow_relay" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:activitypub.:sign_object_fetches" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:activitypub.:authorized_fetch_mode" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:activitypub.:client_api_enabled" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./federation_tab.js"></script>
