<!-- eslint-disable -->
<template>
  <div v-if="!just_deleted">
  <div
      v-if="!isLoaded"
      >
      loading user...
  </div>
    <div
        v-else
        >
        <div v-if="userDetails.id !== this.$store.state.users.currentUser.id">
          <BasicUserCard :user="user">
          <div class="admin-card-content-container">
            <!--<button
              v-if="muted"
              class="btn button-default"
              :disabled="progress"
              @click="unmuteUser"
              >
              <template v-if="progress">
              {{ $t('user_card.unmute_progress') }}
              </template>
              <template v-else>
              {{ $t('user_card.unmute') }}
              </template>
              </button>
              <button
              v-else
              class="btn button-default"
              :disabled="progress"
              @click="muteUser"
              >
              <template v-if="progress">
              {{ $t('user_card.mute_progress') }}
              </template>
              <template v-else>
              {{ $t('user_card.mute') }}
              </template>
              </button>-->
          </div>
          </BasicUserCard>
          <div v-if="!top_level_expanded">
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="top_level_expanded = true"
                      >
                      expand user
                  </button>
          </div>
            <div v-else>
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="top_level_expanded = false"
                      >
                      collapse user
                  </button><br>
              <div v-if="is_local">
                <Checkbox
                    :model-value="is_admin"
                    @update:model-value="v => toggle_admin(v)"
                    >
                    is admin
                </Checkbox><br>
                <Checkbox
                    :model-value="is_moderator"
                    @update:model-value="v => toggle_moderator(v)"
                    >
                    is moderator
                </Checkbox><br>
                <div v-if="!just_confirmed && !is_confirmed">
                  <button class="button button-default btn"
                        type="button"
                        @click="confirm_user()"
                        >
                    is confirmed
                  </button><br>
                  <button class="button button-default btn"
                          type="button"
                          @click="resend_confirmation_email()"
                          >
                          resend confirmation email
                  </button><br>
                </div>
               <Checkbox
                  :model-value="is_approved"
                  @update:model-value="v => toggle_approval(v)"
                  >
                  is approved
              </Checkbox><br>
              </div>
              <Checkbox
                  :model-value="is_activated"
                  @update:model-value="v => toggle_activation(v)"
                  >
                  is active
              </Checkbox><br>
              <button class="button button-default btn"
                      type="button"
                      @click="delete_user()"
                      >
                      delete user
              </button>
            </div>
            <div v-if="!json_expanded"
            >
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="json_expanded = true"
                      >
            expand raw info
                  </button>
          </div>
          <div v-else>
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="json_expanded = false"
                      >
                      collapse raw info
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
