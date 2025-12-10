<template>
  <div :label="$t('admin_dash.tabs.job_queues')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.job_queues.Gun.title') }}</h3>
      <ul class="setting-list">
        <li>
          <h4>{{ $t('admin_dash.job_queues.Gun.connections_pools') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:connections_pool.:connect_timeout" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:connections_pool.:connection_acquisition_retries" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:connections_pool.:connection_acquisition_wait" />
            </li>
            <li>
              <!-- CONFIRM what is this -->
              <IntegerSetting path=":pleroma.:connections_pool.:retry" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:connections_pool.:max_connections" />
            </li>
            <li>
              <!-- CONFIRM what is this -->
              <IntegerSetting path=":pleroma.:connections_pool.:max_idle_time" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:connections_pool.:reclaim_multiplier" />
            </li>
          </ul>
        </li>
        <li>
          <h4>{{ $t('admin_dash.job_queues.Gun.pools.title') }}</h4>
          <ul class="setting-list">
            <li>
              <h5>{{ $t('admin_dash.job_queues.Gun.pools.default') }}</h5>
              <ul class="setting-list suboptions">
                <li>
                  <IntegerSetting path=":pleroma.:pools.:default.:size" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:default.:max_waiting" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:default.:recv_timeout" />
                </li>
              </ul>
              <GroupSetting path=":pleroma.:pools.:default" />
            </li>
            <li>
              <h5>{{ $t('admin_dash.job_queues.Gun.pools.federation') }}</h5>
              <ul class="setting-list suboptions">
                <li>
                  <IntegerSetting path=":pleroma.:pools.:federation.:size" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:federation.:max_waiting" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:federation.:recv_timeout" />
                </li>
              </ul>
              <GroupSetting path=":pleroma.:pools.:federation" />
            </li>
            <li>
              <!-- CONFIRM what is this? -->
              <h5>{{ $t('admin_dash.job_queues.Gun.pools.rich_media') }}</h5>
              <ul class="setting-list suboptions">
                <li>
                  <IntegerSetting path=":pleroma.:pools.:rich_media.:size" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:rich_media.:max_waiting" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:rich_media.:recv_timeout" />
                </li>
              </ul>
              <GroupSetting path=":pleroma.:pools.:rich_media" />
            </li>
            <li>
              <h5>{{ $t('admin_dash.job_queues.Gun.pools.media') }}</h5>
              <ul class="setting-list suboptions">
                <li>
                  <IntegerSetting path=":pleroma.:pools.:media.:size" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:media.:max_waiting" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:pools.:media.:recv_timeout" />
                </li>
              </ul>
              <GroupSetting path=":pleroma.:pools.:media" />
            </li>
          </ul>
        </li>
      </ul>
      <h3>{{ $t('admin_dash.job_queues.Hackney.title') }}</h3>
      <ul class="setting-list">
        <li>
          <h4>{{ $t('admin_dash.job_queues.Hackney.federation') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:federation.:max_connections" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:federation.:timeout" />
            </li>
          </ul>
          <GroupSetting path=":pleroma.:hackney_pools.:federation" />
        </li>
        <li>
          <h4>{{ $t('admin_dash.job_queues.Hackney.media') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:media.:max_connections" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:media.:timeout" />
            </li>
          </ul>
          <GroupSetting path=":pleroma.:hackney_pools.:media" />
        </li>
        <li>
          <!-- CONFIRM what is this -->
          <h4>{{ $t('admin_dash.job_queues.Hackney.rich_media') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:rich_media.:max_connections" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:rich_media.:timeout" />
            </li>
          </ul>
          <GroupSetting path=":pleroma.:hackney_pools.:rich_media" />
        </li>
        <li>
          <h4>{{ $t('admin_dash.job_queues.Hackney.upload') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:upload.:max_connections" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:hackney_pools.:upload.:timeout" />
            </li>
          </ul>
          <GroupSetting path=":pleroma.:hackney_pools.:upload" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./job_queues_tab.js"></script>
