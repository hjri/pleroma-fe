<template>
  <article class="thread-tree">
    <Status
      :key="statusId"
      class="conversation-status conversation-status-treeview panel-body"
      :status-id="statusId"
      :replies="getReplies(statusId)"
      :focused="focused === statusId"

      :thread-display-state="threadDisplay.get(statusId)"

      @dive="$emit('dive', statusId)"
      @goto="$emit('goto', statusId)"
      @toggle-expanded="$emit('toggleExpanded', statusId)"
      @suspendable-state-change="$emit('suspendableStateChange', e)"
    />
    <div
      v-if="currentReplies.length > 0 && threadShowing"
      class="thread-tree-replies"
    >
      <ThreadTree
        v-for="replyStatusId in currentReplies"
        :key="replyStatusId"
        :depth="depth + 1"
        :status-id="replyStatusId"

        @show-thread-recursively="(e) => $emit('showThreadRecursively', e)"
        @goto="(e) => $emit('goto', e)"
        @dive="(e) => $emit('dive', e)"
        @suspendable-state-change="e => $emit('suspendableStateChange', e)"
        @toggle-expanded="(e) => $emit('toggleExpanded', e)"
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
        @click.prevent="$emit('dive', statusId)"
      >
        <template #icon>
          <FAIcon
            icon="angle-double-right"
          />
        </template>
        <template #text>
          <span>
            {{ $t('status.thread_follow', { numStatus: totalReplyCount[statusId] }, totalReplyCount[statusId]) }}
          </span>
        </template>
      </i18n-t>
      <i18n-t
        v-else
        scope="global"
        tag="button"
        keypath="status.thread_show_full_with_icon"
        class="button-unstyled -link thread-tree-show-replies-button"
        @click.prevent="$emit('showThreadRecursively', statusId)"
      >
        <template #icon>
          <FAIcon
            icon="angle-double-down"
          />
        </template>
        <template #text>
          <span>
            {{ $t('status.thread_show_full', { numStatus: totalReplyCount[statusId], depth: totalReplyDepth[statusId] }, totalReplyCount[statusId]) }}
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
