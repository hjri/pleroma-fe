<template>
  <div
    ref="root"
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
      v-if="isPage && !currentStatus"
      class="conversation-body"
      ref="body"
      :class="{ 'panel-body': isExpanded }"
    >
      <p v-if="!loadError">
        <FAIcon
          spin
          icon="circle-notch"
        />
        {{ $t('status.loading') }}
      </p>
      <p v-else>
        {{ $t('status.load_error', { error: loadError }) }}
      </p>
    </div>
    <div
      v-else
      class="conversation-body"
      ref="body"
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
            keypath="currentStatus.show_all_conversation_with_icon"
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
          ref="ancestors"
          class="thread-ancestors"
        >
          <article
            v-for="element in heightChartAncestors"
            class="thread-ancestor"
            :class="{'thread-ancestor-has-other-replies': getReplies(element.id).size > 1, '-faded': shouldFadeAncestors}"
          >
            <Status
              v-if="element.type === 'status'"
              class="conversation-status panel-body"
              :class="getStatusClasses(element.status)"

              :status-id="element.status.id"
              :replies="getReplies(element.status.id)"

              :focused="focused === element.status.id"
              can-dive

              @goto="setFocused"
              @dive="diveIntoStatus(element.status.id)"
              @suspendable-state-change="changeSuspendStateAncestors"
              @height-change="updateVirtualHeightAncestors"
            />
            <div
              v-if="element.type === 'spacer'"
              class="virtual-spacer"
              :style="{ height: element.height + 'px' }"
            />
            <div
              v-if="shouldShowOtherRepliesButton && getReplies(status.id).size > 1"
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
                      {{ $t('status.ancestor_follow', { numReplies: getReplies(status.id).size - 1 }) }}
                    </span>
                  </template>
                </i18n-t>
              </div>
            </div>
          </article>
        </div>
        <div
          class="currentLevel"
          ref="currentLevel"
        >
          <!-- Technically this will always have a single element but -->
          <!-- it's more convenient for us to use a v-for here -->
          <template v-for="element in heightChartCurrentLevel">
            <ThreadTree
              v-if="element.type === 'status'"
              :status-id="currentStatus.id"
              :depth="0"

              @goto="setFocused"
              @dive="diveIntoStatus"
              @toggle-expanded="toggleExpanded"
              @show-thread-recursively="showThreadRecursively"
              @suspendable-state-change="changeSuspendStateCurrentLevel"
              @height-change="updateVirtualHeightCurrentLevel"
            />
            <div
              v-if="element.type === 'spacer'"
              class="virtual-spacer"
              :style="{ height: element.height + 'px' }"
            />
          </template>
        </div>
      </div>
      <div
        v-else-if="isLinearView"
        ref="linear"
        class="thread-body"
      >
        <article
          v-for="element in heightChartLinear"
          class="panel-body"
          :key="element.id ?? element.ids"
        >
          <Status
            v-if="element.type === 'status'"
            class="conversation-status"
            :class="getStatusClasses(status)"
            :status-id="element.status.id"
            :replies="getReplies(status.id)"

            :focused="focused === element.id || focused === element.status.retweeted_status?.id"

            @goto="setFocused"
            @toggle-expanded="toggleExpanded"
            @suspendable-state-change="changeSuspendStateLinear"
            @height-change="updateVirtualHeightLinear"
          />
          <div
            v-if="element.type === 'spacer'"
            class="virtual-spacer"
            :style="{ height: element.height + 'px' }"
          />
        </article>
      </div>
    </div>
  </div>
</template>

<script src="./conversation.js"></script>
<style src="./conversation.scss" />
