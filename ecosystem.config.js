module.exports = {
  apps: [
    {
      name: 'be-jsonrock-prod',
      script: 'pnpm',
      args: 'run start',
      env: {
        ...process.env,
        PORT: 3008,
      },
    },
    {
      name: 'be-jsonrock-dev',
      script: 'pnpm',
      args: 'run start',
      env: {
        ...process.env,
        PORT: 3009,
      },
    },
  ],
}
