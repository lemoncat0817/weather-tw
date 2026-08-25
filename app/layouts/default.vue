<script setup lang="ts">
const navItems = [
  { to: '/', label: '首頁' },
  { to: '/map', label: '地圖' },
  { to: '/typhoon', label: '颱風' },
  { to: '/earthquake', label: '地震' },
  { to: '/observation', label: '觀測' },
  { to: '/climate', label: '趨勢' },
  { to: '/warnings', label: '特報' }
]

const mobileNavOpen = ref(false)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-0">
    <a
      href="#main-content"
      class="sr-only rounded-md bg-accent px-3 py-2 text-sm text-surface-0 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
    >
      跳到主要內容
    </a>

    <header
      class="sticky top-0 z-40 border-b border-border bg-surface-0/90 backdrop-blur supports-[backdrop-filter]:bg-surface-0/70"
    >
      <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <NuxtLink to="/" class="flex items-center gap-2 text-text-primary">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.5 19a4.5 4.5 0 0 1-.5-8.98A5.5 5.5 0 0 1 16.4 8.06 4 4 0 0 1 16 16H6.5Z"
              />
            </svg>
          </span>
          <span class="text-sm font-semibold tracking-wide">氣象知多少</span>
        </NuxtLink>

        <nav class="hidden items-center gap-1 md:flex" aria-label="主要導覽">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            active-class="!bg-surface-2 !text-text-primary"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <button
          type="button"
          class="rounded-md p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary md:hidden"
          :aria-expanded="mobileNavOpen"
          aria-controls="mobile-nav"
          aria-label="切換導覽選單"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav
        v-if="mobileNavOpen"
        id="mobile-nav"
        class="border-t border-border px-4 py-2 md:hidden"
        aria-label="主要導覽（行動版）"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary"
          active-class="!bg-surface-2 !text-text-primary"
          @click="mobileNavOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </header>

    <main id="main-content" class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <slot />
    </main>

    <footer class="border-t border-border px-4 py-4 text-center text-xs text-text-muted">
      資料來源：<a href="https://opendata.cwa.gov.tw" target="_blank" rel="noopener" class="hover:text-text-secondary">中央氣象署開放資料平台</a>
    </footer>
  </div>
</template>
