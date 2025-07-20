<!-- eslint-disable -->
<template>
  <TabSwitcher
      :scrollable-tabs="false"
      class="user-tab"
      >
      <div :label="$t('admin_dash.users.management')">
        <div class="setting-item">
          <h2> filter user search </h2>
          todo: query, name and email input<br>
          <Select
              :model-value="filters_origin"
              @update:model-value="v => update_origin(v) "
              >
              <option
                  value="all"
                  >
                  all
              </option>
              <option
                  value="local"
                  >
                  local only
              </option>
              <option
                  value="external"
                  >
                  external only
              </option>
          </Select>
          <Select
              :model-value="filters_activity"
              @update:model-value="v => update_activity(v) "
              >
              <option
                  value="all"
                  >
                  all
              </option>
              <option
                  value="active"
                  >
                  active only
              </option>
              <option
                  value="deactivated"
                  >
                  deactivated only
              </option>
          </Select>
          <Select
              :model-value="filters_permission"
              @update:model-value="v => update_permission(v) "
              >
              <option
                  value="all"
                  >
                  all
              </option>
              <option
                  value="admin"
                  >
                  admin only
              </option>
              <option
                  value="modsnadmins"
                  >
                  all privileged
              </option>
              <option
                  value="moderator"
                  >
                  moderator only
              </option>
          </Select>
          <Checkbox
              @update:model-value="v => {filters.need_approval = v; reset();}"
              >
              only unapproved
          </Checkbox>
          <Checkbox
              @update:model-value="v => {filters.unconfirmed = v; reset();}"
              >
              only unconfirmed
          </Checkbox>
        </div>
        <PageList
            ref="userList"
            :refresh="true"
            :get-key="i => i"
            :box-only="true"
            :page-size="50"
            :fetch-page="(store, opts) => this.fetch_page(store, opts)"
            >
            <template #header>
              <button
                  class="button button-default btn"
                  type="button"
                  @click="delete_selection"
                  >
                  {{ $t('admin_dash.users.activate') }}
              </button>
                <button
                    class="button button-default btn"
                    type="button"
                    @click="activate_selection"
                    >
                    {{ $t('admin_dash.users.deactivate') }}
                </button>
                  <button
                      class="button button-default btn"
                      type="button"
                      @click="deactivate_selection"
                      >
                      {{ $t('admin_dash.users.delete') }}
                  </button>
            </template>
            <template #item="{item}">
              <AdminCard :user-details="item" />
            </template>
        </PageList>
      </div>

      <div :label="$t('admin_dash.users.invitations')">
        TBC
      </div>
  </TabSwitcher>
</template>
<script src="./users_tab.js"></script>
<style lang="scss" src="./users_tab.scss"></style>
