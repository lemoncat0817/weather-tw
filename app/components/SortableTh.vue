<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    active?: boolean
    desc?: boolean
    align?: 'left' | 'right' | 'center'
  }>(),
  {
    active: false,
    desc: true,
    align: 'left'
  }
)

defineEmits<{
  click: [event: MouseEvent | KeyboardEvent]
}>()

const ariaSort = computed(() => {
  if (!props.active) return 'none'
  return props.desc ? 'descending' : 'ascending'
})
</script>

<template>
  <th
    scope="col"
    role="columnheader"
    :aria-sort="ariaSort"
    tabindex="0"
    :class="[
      'group cursor-pointer select-none px-3 py-2 font-normal transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
      active ? 'text-text-primary font-medium' : 'text-text-muted'
    ]"
    @click="$emit('click', $event)"
    @keydown.enter.prevent="$emit('click', $event)"
    @keydown.space.prevent="$emit('click', $event)"
  >
    <div
      :class="[
        'inline-flex items-center gap-1.5',
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
      ]"
    >
      <span><slot /></span>
      <span class="inline-flex shrink-0 items-center">
        <!-- 作用中且降序 (高到低 / Z到A) -->
        <svg
          v-if="active && desc"
          viewBox="0 0 24 24"
          class="h-3.5 w-3.5 text-accent"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14m-5-5 5 5 5-5" />
        </svg>

        <!-- 作用中且升序 (低到高 / A到Z) -->
        <svg
          v-else-if="active && !desc"
          viewBox="0 0 24 24"
          class="h-3.5 w-3.5 text-accent"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5m-5 5 5-5 5 5" />
        </svg>

        <!-- 未排序欄位：顯示淡色雙向箭頭，Hover 時提示可點擊 -->
        <svg
          v-else
          viewBox="0 0 24 24"
          class="h-3.5 w-3.5 text-text-muted/30 transition-colors group-hover:text-text-muted/80"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
        </svg>
      </span>
    </div>
  </th>
</template>
