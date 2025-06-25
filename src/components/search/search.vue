<template>
  <div class="Search panel panel-default">
    <div class="panel-heading">
      <h1 class="title">
        {{ $t('nav.search') }}
      </h1>
    </div>
    <div class="panel-body search-input-container">
      <input
        ref="searchInput"
        v-model="searchTerm"
        class="input search-input"
        :placeholder="$t('nav.search')"
        @keyup.enter="newQuery(searchTerm)"
      >
      <button
        class="btn button-default search-button"
        type="submit"
        @click="newQuery(searchTerm)"
      >
        <FAIcon icon="search" />
      </button>
    </div>
    <div
      v-if="loading && statusesOffset == 0"
      class="panel-body text-center loading-icon"
    >
      <FAIcon
        icon="circle-notch"
        spin
        size="lg"
      />
    </div>
    <div v-else-if="loaded">
      <div class="search-nav-heading">
        <tab-switcher
          ref="tabSwitcher"
          :on-switch="onResultTabSwitch"
          :active-tab="currenResultTab"
        >
          <span
            key="statuses"
            :label="$t('user_card.statuses') + resultCount('visibleStatuses')"
          />
          <span
            key="people"
            :label="$t('search.people') + resultCount('users')"
          />
          <span
            key="hashtags"
            :label="$t('search.hashtags') + resultCount('hashtags')"
          />
        </tab-switcher>
      </div>
    </div>
    <div class="panel-body">
      <div v-if="currenResultTab === 'statuses'">
        <Status
          v-for="status in visibleStatuses"
          :key="status.id"
          :collapsable="false"
          :expandable="false"
          :compact="false"
          class="search-result"
          :statusoid="status"
          :no-heading="false"
        />
        <button
          v-if="!loading && loaded && lastStatusFetchCount > 0"
          class="more-statuses-button button-unstyled -link"
          @click.prevent="search(searchTerm, 'statuses')"
        >
          <div class="new-status-notification text-center">
            {{ $t('search.load_more') }}
          </div>
        </button>
        <div
          v-else-if="loading && statusesOffset > 0"
          class="text-center loading-icon"
        >
          <FAIcon
            icon="circle-notch"
            spin
            size="lg"
          />
        </div>
        <div
          v-if="(visibleStatuses.length === 0 || lastStatusFetchCount === 0) && !loading && loaded"
          class="search-result-heading"
        >
          <h4>
            {{ visibleStatuses.length === 0 ? $t('search.no_results') : $t('search.no_more_results') }}
          </h4>
        </div>
      </div>
      <div v-else-if="currenResultTab === 'people'">
        <div
          v-if="users.length === 0 && !loading && loaded"
          class="search-result-heading"
        >
          <h4>{{ $t('search.no_results') }}</h4>
        </div>
        <FollowCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          class="list-item search-result"
        />
      </div>
      <div v-else-if="currenResultTab === 'hashtags'">
        <div
          v-if="hashtags.length === 0 && !loading && loaded"
          class="search-result-heading"
        >
          <h4>{{ $t('search.no_results') }}</h4>
        </div>
        <div
          v-for="hashtag in hashtags"
          :key="hashtag.url"
          class="status trend search-result"
        >
          <router-link
            class="list-item hashtag"
            :to="{ name: 'tag-timeline', params: { tag: hashtag.name } }"
          >
            <span class="name">
              #{{ hashtag.name }}
            </span>
            <div v-if="lastHistoryRecord(hashtag)">
              <span v-if="lastHistoryRecord(hashtag).accounts == 1">
                {{ $t('search.person_talking', { count: lastHistoryRecord(hashtag).accounts }) }}
              </span>
              <span v-else>
                {{ $t('search.people_talking', { count: lastHistoryRecord(hashtag).accounts }) }}
              </span>
            </div>
          </router-link>
          <div
            v-if="lastHistoryRecord(hashtag)"
            class="count"
          >
            {{ lastHistoryRecord(hashtag).uses }}
          </div>
        </div>
      </div>
    </div>
    <div class="search-result-footer text-center panel-footer faint" />
  </div>
</template>

<script src="./search.js"></script>

<style lang="scss">
.search-result-heading {
  color: var(--faint);
  padding: 0.75rem;
  text-align: center;
}

@media all and (width <= 800px) {
  .search-nav-heading {
    .tab-switcher .tabs .tab-wrapper {
      display: block;
      justify-content: center;
      flex: 1 1 auto;
      text-align: center;
    }
  }
}

.search-result {
  box-sizing: border-box;
  border-bottom: 1px solid;
  border-color: var(--border);
}

.search-input-container {
  padding: 0.8rem;
  display: flex;
  justify-content: center;

  .search-input {
    width: 100%;
    line-height: 1.125rem;
    font-size: 1rem;
    padding: 0.5rem;
    box-sizing: border-box;
  }

  .search-button {
    margin-left: 0.5em;
  }
}

.loading-icon {
  padding: 1em;
}

.trend {
  display: flex;
  align-items: center;

  .hashtag {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .name {
      color: var(--link);
    }
  }

  .count {
    flex: 0 0 auto;
    width: 2rem;
    font-size: 1.5rem;
    line-height: 2.25rem;
    font-weight: 500;
    text-align: center;
    color: var(--text);
  }
}

.more-statuses-button {
  height: 3.5em;
  line-height: 3.5em;
  width: 100%;
}

</style>
