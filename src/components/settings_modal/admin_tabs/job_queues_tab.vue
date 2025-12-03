<template>
  <div :label="$t('admin_dash.tabs.job_queues')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.job_queues.Oban') }}</h3>
      <ul class="setting-list">
        <li>
          <ChoiceSetting path=":pleroma.Oban.:log" />
          <h4>{{ $t('admin_dash.job_queues.queues') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting
                suggestions="50"
                path=":pleroma.Oban.:queues.:federator_incoming"
              />
            </li>
            <li>
              <IntegerSetting
                suggestions="50"
								path=":pleroma.Oban.:queues.:federator_outgoing"
							/>
            </li>
            <li>
              <IntegerSetting
                suggestions="5"
								path=":pleroma.Oban.:queues.:attachments_cleanup"
							/>
            </li>
            <li>
              <IntegerSetting
                suggestions="10"
								path=":pleroma.Oban.:queues.:mailer"
							/>
            </li>
            <li>
              <IntegerSetting
                suggestions="10"
								path=":pleroma.Oban.:queues.:activity_expiration"
							/>
            </li>
            <li>
              <IntegerSetting
                suggestions="10"
								path=":pleroma.Oban.:queues.:scheduled_activities"
							/>
            </li>
            <li>
              <IntegerSetting
                suggestions="20"
								path=":pleroma.Oban.:queues.:transmogrifier"
							/>
            </li>
            <li>
              <IntegerSetting
                suggestions="50"
								path=":pleroma.Oban.:queues.:web_push"
							/>
            </li>
            <!-- CONFIRM what is this queue -->
            <li>
              <IntegerSetting
								path=":pleroma.Oban.:queues.:slow"
							/>
            </li>
            <!-- CONFIRM what is this queue -->
            <li>
              <IntegerSetting
								path=":pleroma.Oban.:queues.:background"
							/>
            </li>
          </ul>
          <GroupSetting path=":pleroma.Oban.queues" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./job_queues_tab.js"></script>
