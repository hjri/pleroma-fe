<!-- eslint-disable -->
<template>
  <div v-if="!just_deleted">
  <div
      v-if="!isLoaded"
      >
      {{ $t('admin_dash.users.loading_user') }}
  </div>
    <div
        v-else
        >
        <div v-if="userDetails.id !== this.$store.state.users.currentUser.id">
          <BasicUserCard :user="user" />
          <div v-if="!top_level_expanded">
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="top_level_expanded = true"
                      >
                      {{ $t('admin_dash.users.expand_user') }}
                  </button>
          </div>
            <div
              class="setting-item"
              v-else
            >
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="top_level_expanded = false"
                      >
                      {{ $t('admin_dash.users.collapse_user') }}
                  </button><br>
              <div v-if="is_local">
                <Checkbox
                    :model-value="is_admin"
                    @update:model-value="v => toggle_admin(v)"
                    >
                    {{ $t('admin_dash.users.is_admin') }}
                </Checkbox><br>
                <Checkbox
                    :model-value="is_moderator"
                    @update:model-value="v => toggle_moderator(v)"
                    >
                    {{ $t('admin_dash.users.is_moderator') }}
                </Checkbox><br>
                <div v-if="!just_confirmed && !is_confirmed">
                  <button class="button button-default btn"
                        type="button"
                        @click="confirm_user()"
                        >
                    {{ $t('admin_dash.users.is_confirmed') }}
                  </button><br>
                  <button class="button button-default btn"
                          type="button"
                          @click="resend_confirmation_email()"
                          >
                           {{ $t('admin_dash.users.resend_confirmation_email') }}
                  </button><br>
                </div>
               <div v-if="!is_approved">
                 <button
                     class="button button-default btn"
                     type="button"
                     @click="toggle_approval(true)"
                  >
                  {{ $t('admin_dash.users.approve') }}
                 </button><br>
               </div>
              </div>
              <Checkbox
                  :model-value="is_activated"
                  @update:model-value="v => toggle_activation(v)"
                  >
                  {{ $t('admin_dash.users.is_active') }}
              </Checkbox><br>
              <button class="button button-default btn"
                      type="button"
                      @click="delete_user()"
                      >
                     {{ $t('admin_dash.users.delete_user') }}
              </button>
            </div>
            <div v-if="!timeline_expanded">
              <button class="button button-default btn"
                      type="button"
                      @click="timeline_expanded = true"
                      >
                     {{ $t('admin_dash.users.expand_timeline') }}
              </button>
            </div>
            <div
              class="setting-item"
              v-else
            >
              <button class="button button-default btn"
                      type="button"
                      @click="timeline_expanded = false"
                      >
                     {{ $t('admin_dash.users.collapse_timeline') }}
              </button>
                <PageList
                  ref="timelineList"
                  :refresh="true"
                  :get-key="i => i"
                  :box-only="true"
                  :page-size="20"
                  :single-page="true"
                  :fetch-page="(store, opts) => this.fetch_statuses(store, opts)"
                >
               <template #item="{item}">
                 <AdminStatusCard :status-details="item" />
               </template>
                </PageList>
            </div>
            <div v-if="!json_expanded"
            >
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="json_expanded = true"
                      >
                     {{ $t('admin_dash.users.expand_raw_info') }}
                  </button>
          </div>
          <div 
            class="setting-item"
            v-else
          >
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="json_expanded = false"
                      >
                     {{ $t('admin_dash.users.collapse_raw_info') }}
                  </button>
           <h2> database </h2>
           <pre> {{ JSON.stringify(user, null, 2) }} </pre>
           <h2> details </h2>
           <pre> {{ JSON.stringify(this.userDetails, null, 2) }} </pre>
          </div>
        </div>
    </div>
  </div>
</template>

<script src="./admin_card.js"></script>

<style lang="scss">
.admin-card-content-container {
  margin-top: 0.5em;
  text-align: right;

  button {
    width: 10em;
  }
}
</style>
