// @nuxt/eslint 依專案的 nuxt.config.ts / 檔案結構自動產生基礎 flat config
// （型別、Vue 規則、auto-import 全域變數等），這裡只疊加專案自訂規則
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // src/ 是舊 Vue SPA，遷移期間保留供對照，Phase 7 會整個刪除；
    // worker/ 是獨立子專案，有自己的 tsconfig/依賴，不用根目錄規則檢查
    ignores: ['src/**', 'worker/**', 'dist/**', '.output/**']
  },
  {
    name: 'app/rules',
    rules: {
      // 允許漸進式補型別，暫不強制禁用 any（沿用上一輪對舊碼的決定，新碼盡量避免）
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)
