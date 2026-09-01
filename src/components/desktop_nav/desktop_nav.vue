<template>
  <nav
    id="nav"
    class="DesktopNav"
    :class="{ '-logoLeft': logoLeft }"
    @click="scrollToTop()"
  >
    <div class="inner-nav">
      <div class="item sitename">
        <router-link
          v-if="!hideSitename"
          class="site-name"
          :to="{ name: 'root' }"
          active-class="home"
        >
          {{ sitename }}
        </router-link>
        <div
          class="nav-icon"
          v-if="streamingEnabled"
          :title="streamingTooltip"
        >
          <FAIcon
            v-if="streamingConnected"
            fixed-width
            class="fa-scale-110 fa-old-padding"
            icon="plug"
          />
          <FAIcon
            v-else
            fixed-width
            class="fa-scale-110 fa-old-padding"
            icon="plug-circle-xmark"
          />
        </div>
      </div>
      <router-link
        class="logo"
        :to="{ name: 'root' }"
        :style="logoBgStyle"
        :title="sitename"
      >
        <div
          class="mask"
          :style="logoMaskStyle"
        />
        <img
          :src="logo"
          :style="logoStyle"
        >
      </router-link>
      <div class="item right actions">
        <SearchBar
          v-if="currentUser || !privateMode"
          @toggled="onSearchBarToggled"
          @click.stop
        />
        <template v-if="searchBarHidden">
          <button
            class="button-unstyled nav-icon"
            :title="$t('nav.preferences')"
            @click.stop="openSettingsModal('user')"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="cog"
            />
          </button>
          <button
            v-if="currentUser?.role === 'admin'"
            class="button-unstyled nav-icon"
            target="_blank"
            :title="$t('nav.administration')"
            @click.stop="openSettingsModal('admin')"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="tachometer-alt"
            />
          </button>
          <span class="spacer" />
          <button
            v-if="currentUser"
            class="button-unstyled nav-icon"
            :title="$t('login.logout')"
            @click.stop.prevent="logout"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="sign-out-alt"
            />
          </button>
        </template>
      </div>
    </div>
    <teleport to="#modal">
      <ConfirmModal
        v-if="showingConfirmLogout"
        :title="$t('login.logout_confirm_title')"
        :confirm-danger="true"
        :confirm-text="$t('login.logout_confirm_accept_button')"
        :cancel-text="$t('login.logout_confirm_cancel_button')"
        @accepted="doLogout"
        @cancelled="hideConfirmLogout"
      >
        {{ $t('login.logout_confirm') }}
      </ConfirmModal>
    </teleport>
  </nav>
</template>
<script src="./desktop_nav.js"></script>

<style src="./desktop_nav.scss" lang="scss"></style>
