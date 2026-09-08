<template>
  <div
    v-if="!hide"
    ref="body"
    class="Conversation"
    :class="{ '-expanded' : isExpanded, '-page': isPage, 'panel' : isExpanded }"
  >
    <div
      v-if="isExpanded"
      class="panel-heading conversation-heading -sticky"
    >
      <h1 class="title">
        <RichContent
          v-if="conversation[0]?.summary_raw_html"
          :html="conversation[0].summary_raw_html"
          :emoji="conversation[0].emojis"
        />
        <template v-else>
          {{ $t('timeline.conversation') }}
        </template>
      </h1>
      <button
        v-if="!isPage"
        class="button-unstyled -link"
        @click.prevent="toggleExpanded"
      >
        {{ $t('timeline.collapse') }}
      </button>
      <QuickFilterSettings
        v-if="isPage && mobileLayout"
        :conversation="true"
        class="rightside-button"
      />
      <QuickViewSettings
        v-if="isPage"
        :conversation="true"
        class="rightside-button"
      />
    </div>
    <div
      v-if="isPage && !status"
      class="conversation-body"
      :class="{ 'panel-body': isExpanded }"
    >
      <p v-if="!loadStatusError">
        <FAIcon
          spin
          icon="circle-notch"
        />
        {{ $t('status.loading') }}
      </p>
      <p v-else>
        {{ $t('status.load_error', { error: loadStatusError }) }}
      </p>
    </div>
    <div
      v-else
      class="conversation-body"
      :class="{ 'panel-body': isExpanded }"
    >
      <div
        v-if="isTreeView"
        class="thread-body"
      >
        <div
          v-if="shouldShowAllConversationButton"
          class="conversation-dive-to-top-level-box"
        >
          <i18n-t
            keypath="status.show_all_conversation_with_icon"
            tag="button"
            class="button-unstyled -link"
            scope="global"
            @click.prevent="diveToTopLevel"
          >
            <template #icon>
              <FAIcon
                icon="angle-double-left"
              />
            </template>
            <template #text>
              <span>
                {{ $t('status.show_all_conversation', { numStatus: topLevel.length - 1 }, topLevel.length - 1) }}
              </span>
            </template>
          </i18n-t>
        </div>
        <div
          v-if="shouldShowAncestors"
          class="thread-ancestors"
        >
          <article
            v-for="status in currentAncestors"
            class="thread-ancestor"
            :class="{'thread-ancestor-has-other-replies': statusReplies.size > 1, '-faded': shouldFadeAncestors}"
          >
            <Status
              class="conversation-status panel-body"
              :class="getStatusClasses(status)"

              :status-id="status.id"
              :replies="statusReplies"

              :focused="focused === status.id"
              can-dive

              @goto="setFocused"
              @dive="diveIntoStatus(status.id)"
              @suspendable-state-change="onStatusSuspendStateChange"
              @height-change="updateVirtualHeight"
            />
            <div
              v-if="shouldShowOtherRepliesButton && statusReplies.size > 1"
              class="thread-ancestor-dive-box"
            >
              <div
                class="thread-ancestor-dive-box-inner"
              >
                <i18n-t
                  tag="button"
                  scope="global"
                  keypath="status.ancestor_follow_with_icon"
                  class="button-unstyled -link thread-tree-show-replies-button"
                  @click.prevent="diveIntoStatus(status.id)"
                >
                  <template #icon>
                    <FAIcon
                      icon="angle-double-right"
                    />
                  </template>
                  <template #text>
                    <span>
                      {{ $t('status.ancestor_follow', { numReplies: statusReplies.size - 1 }) }}
                    </span>
                  </template>
                </i18n-t>
              </div>
            </div>
          </article>
        </div>
        <ThreadTree
          :status-id="status.id"
          :depth="0"

          @goto="setFocused"
          @dive="diveIntoStatus"
          @toggle-expanded="toggleExpanded"
          @show-thread-recursively="showThreadRecursively"
          @suspendable-state-change="onStatusSuspendStateChange"
          @height-change="updateVirtualHeight"
        />
      </div>
      <div
        v-else-if="isLinearView"
        class="thread-body"
      >
        <article
          v-for="status in conversation"
          class="panel-body"
        >
          <Status
            :key="status.id"
            class="conversation-status"
            :class="getStatusClasses(status)"
            :status-id="status.id"
            :replies="getReplies(status.id)"

            :focused="focused === status.id || focused === status.retweeted_status?.id"

            @goto="setFocused"
            @toggle-expanded="toggleExpanded"
            @suspendable-state-change="onStatusSuspendStateChange"
            @height-change="updateVirtualHeight"
          />
        </article>
      </div>
    </div>
  </div>
  <div
    v-else
    class="Conversation -hidden"
    :style="hiddenStyle"
  />
</template>

<script src="./conversation.js"></script>
<style src="./conversation.scss" />
