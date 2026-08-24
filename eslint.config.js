import { globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs, configureVueProject } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

configureVueProject({
  rootDir: import.meta.dirname
})

export default defineConfigWithVueTs(
  globalIgnores(['dist/**', 'dist-ssr/**', 'coverage/**', 'worker/.wrangler/**']),
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': ['error', { ignores: ['index'] }],
      // vueTsConfigs.recommended is typescript-eslint's actual "recommended" preset, which is
      // stricter than the untyped `plugin:@typescript-eslint/eslint-recommended` this project used
      // under the old .eslintrc. Restoring the two rules the codebase actually relies on differing
      // from that default, rather than fixing 100+ pre-existing `any` usages as part of a tooling swap.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  }
)
