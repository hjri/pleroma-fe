<template>
  <article class="thread-tree">
    <Status
      :key="status.id"
      ref="statusComponent"
      :statusoid="status"
      :replies="getReplies(status.id)"
      :inline-expanded="collapsable && isExpanded"
      :expandable="!isExpanded"
      :show-pinned="pinnedStatusIdsObject && pinnedStatusIdsObject[status.id]"
      :focused="isFocusedFunction(status.id)"
      :in-conversation="isExpanded"
      :highlight="highlight"
      :in-profile="inProfile"
      :profile-user-id="profileUserId"
      class="conversation-status conversation-status-treeview status-fadein panel-body"

      :simple-tree="simple"
      :thread-display-status="threadDisplayStatus[status.id]"

      :can-dive="canDive"
      @dive="$emit('dive', status.id)"
      @goto="setHighlight"
      @toggle-expanded="toggleExpanded"
      @suspendable-state-change="e => $emit('suspendableStateChange', e)"
    />
    <div
      v-if="currentReplies.length > 0 && threadShowing"
      class="thread-tree-replies"
    >
      <ThreadTree
        v-for="replyStatus in currentReplies"
        :key="replyStatus.id"
        ref="childComponent"
        :depth="depth + 1"
        :status="replyStatus"

        :in-profile="inProfile"
        :conversation="conversation"
        :collapsable="collapsable"
        :is-expanded="isExpanded"
        :pinned-status-ids-object="pinnedStatusIdsObject"
        :profile-user-id="profileUserId"

        :is-focused-function="isFocusedFunction"
        :get-replies="getReplies"
        :highlight="highlight"
        :set-highlight="setHighlight"
        :toggle-expanded="toggleExpanded"

        :simple="simple"
        :thread-display-status="threadDisplayStatus"
        :show-thread-recursively="showThreadRecursively"
        :total-reply-count="totalReplyCount"
        :total-reply-depth="totalReplyDepth"

        :can-dive="canDive"
        @dive="(e) => $emit('dive', e)"
        @suspendable-state-change="e => $emit('suspendableStateChange', e)"
      />
    </div>
    <div
      v-if="currentReplies.length && !threadShowing"
      class="thread-tree-replies thread-tree-replies-hidden"
    >
      <i18n-t
        v-if="simple"
        scope="global"
        tag="button"
        keypath="status.thread_follow_with_icon"
        class="button-unstyled -link thread-tree-show-replies-button"
        @click.prevent="$emit('dive', status.id)"
      >
        <template #icon>
          <FAIcon
            icon="angle-double-right"
          />
        </template>
        <template #text>
          <span>
            {{ $t('status.thread_follow', { numStatus: totalReplyCount[status.id] }, totalReplyCount[status.id]) }}
          </span>
        </template>
      </i18n-t>
      <i18n-t
        v-else
        scope="global"
        tag="button"
        keypath="status.thread_show_full_with_icon"
        class="button-unstyled -link thread-tree-show-replies-button"
        @click.prevent="showThreadRecursively(status.id)"
      >
        <template #icon>
          <FAIcon
            icon="angle-double-down"
          />
        </template>
        <template #text>
          <span>
            {{ $t('status.thread_show_full', { numStatus: totalReplyCount[status.id], depth: totalReplyDepth[status.id] }, totalReplyCount[status.id]) }}
          </span>
        </template>
      </i18n-t>
    </div>
  </article>
</template>

<script src="./thread_tree.js"></script>

<style lang="scss">
.thread-tree-replies {
  margin-left: var(--status-margin);
  border-left: 2px solid var(--border);
}

.thread-tree-replies-hidden {
  padding: var(--status-margin);

  /* Make the button stretch along the whole row */
  display: flex;
  align-items: stretch;
  flex-direction: column;
}
</style>
