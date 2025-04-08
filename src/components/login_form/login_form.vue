<template>
  <div class="login-panel panel panel-default">
    <!-- Default panel contents -->

    <div class="panel-heading">
      <h1 class="title">
        {{ $t('login.login') }}
      </h1>
    </div>

    <div class="panel-body">
      <form
        class="login-form"
        @submit.prevent="submit"
      >
        <template v-if="isPasswordAuth">
          <div class="form-group">
            <label for="username">{{ $t('login.username') }}</label>
            <input
              id="username"
              v-model="user.username"
              :disabled="loggingIn"
              class="input form-control"
              :placeholder="$t('login.placeholder')"
            >
          </div>
          <div class="form-group">
            <label for="password">{{ $t('login.password') }}</label>
            <input
              id="password"
              ref="passwordInput"
              v-model="user.password"
              :disabled="loggingIn"
              class="input form-control"
              type="password"
            >
          </div>
          <div class="form-group">
            <router-link :to="{name: 'password-reset'}">
              {{ $t('password_reset.forgot_password') }}
            </router-link>
          </div>
        </template>

        <div
          v-if="isTokenAuth"
          class="form-group"
        >
          <p>{{ $t('login.description') }}</p>
        </div>

        <div class="form-group">
          <div class="login-bottom">
            <div>
              <router-link
                v-if="registrationOpen"
                :to="{name: 'registration'}"
                class="register"
              >
                {{ $t('login.register') }}
              </router-link>
            </div>
            <button
              :disabled="loggingIn"
              type="submit"
              class="btn button-default"
            >
              {{ $t('login.login') }}
            </button>
          </div>
        </div>
      </form>
      <div
        v-if="error"
        class="login-error alert error"
      >
        <span class="error-message">
          {{ error }}
        </span>
        <button
          class="button-unstyled"
          @click="clearError"
        >
          <FAIcon
            class="fa-scale-110 fa-old-padding"
            icon="times"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./login_form.js"></script>

<style src="./login_form.scss" />
