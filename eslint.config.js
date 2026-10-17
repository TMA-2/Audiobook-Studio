// eslint.config.js
import plugin from '@stylistic/eslint-plugin'
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/indent': ['error', 2],
    }
  }
  // ...your other config items
]
