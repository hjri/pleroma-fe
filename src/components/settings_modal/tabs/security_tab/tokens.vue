<template>
  <table class="Tokens">
    <thead>
      <tr>
        <th class="selection">
          <Checkbox
            :model-value="allSelected"
            :indeterminate="someSelected"
            @update:model-value="toggleSelectAll"
            :title="$t('selectable_list.select_all')"
          />
        </th>
        <th>{{ $t('settings.app_name') }}</th>
        <th>{{ $t('settings.valid_until') }}</th>
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="oauthToken in allTokens"
        :key="oauthToken.id"
      >
        <td class="selection">
          <Checkbox
            :model-value="selected.has(oauthToken.id)"
            @update:model-value="e => toggleSelect(oauthToken.id, e)"
            :title="$t('selectable_list.select')"
          />
        </td>
        <td>
          {{ oauthToken.appName }} {{ oauthToken.current }}
        </td>
        <td>{{ oauthToken.validLocalized }}</td>
        <td class="actions">
          <button
            class="btn button-default"
            @click="revokeToken(oauthToken.id)"
          >
            {{ $t('settings.revoke_token') }}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script src="./tokens.js" />
<style src="./tokens.scss" />
