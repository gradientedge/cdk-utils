export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '16'
        },
        modules: false
      }
    ]
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties'
  ]
}