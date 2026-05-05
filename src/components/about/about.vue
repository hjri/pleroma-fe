<template>
  <div class="About column-inner">
    <instance-specific-panel v-if="showInstanceSpecificPanel" />
    <staff-panel />
    <terms-of-service-panel />
    <MRFTransparencyPanel />
    <features-panel v-if="showFeaturesPanel" />
    <div class="panel panel-default">
      <div class="panel-heading">
        <div class="title">{{ $t('settings.version.title') }}</div>
      </div>
      <div class="panel-body">
        <dl>
          <dt>{{ $t('settings.version.backend_version') }}</dt>
          <dd>
            <a
              :href="backendRepository"
              target="_blank"
            >
              {{ backendVersion }}
            </a>
          </dd>
          <dt>{{ $t('settings.version.frontend_version') }}</dt>
          <dd>
            <a
              :href="frontendVersionLink"
              target="_blank"
            >
              {{ frontendVersion }}
            </a>
          </dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<script src="./about.js"></script>
<style>
  .About {
    dl {
      padding-left: 1em;
    }
  }
</style>
