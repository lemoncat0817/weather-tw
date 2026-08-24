import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'jsdom',
    // 只掃新架構（app/server/shared）；src/ 是舊 Vue SPA，遷移期間保留供對照，
    // Phase 7 會整個刪除，不該被新的測試/建置流程處理
    include: [
      'app/**/__tests__/**/*.test.ts',
      'server/**/__tests__/**/*.test.ts',
      'shared/**/__tests__/**/*.test.ts'
    ]
  }
})
