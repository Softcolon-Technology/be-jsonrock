const config = {
  '*.{jsx,ts,tsx}': ['pnpm run format', 'pnpm run lint:fix'],
  '*.{css,scss}': ['pnpm run format'],
  '*.{json,html,md,mdx,yml}': ['pnpm run format'],
}

module.exports = config
