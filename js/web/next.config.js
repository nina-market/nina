const path = require('path')
const withTM = require('next-transpile-modules')([
  '@project-serum/sol-wallet-adapter',
  '@solana/wallet-adapter-base',
  '@solana/wallet-adapter-react',
  '@solana/wallet-adapter-wallets',
  '@solana/wallet-adapter-material-ui',
  '@solana/wallet-adapter-react-ui',
  '@solana/wallet-adapter-phantom',
  '@solana/wallet-adapter-solflare',
  '@solana/wallet-adapter-sollet',
]) // pass the modules you would like to see transpiled
const { withSentryConfig } = require('@sentry/nextjs');
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

const cluster = 'devnet'
const moduleExports = withTM({
  distDir: './build',
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      https: false,
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@nina-protocol/nina-sdk': path.resolve(
        '../node_modules/@nina-protocol/nina-sdk'
      ),
      react: path.resolve('../node_modules/react'),
      crypto: path.resolve('../node_modules/crypto-browserify'),
      stream: path.resolve('../node_modules/stream-browserify'),
      zlib: path.resolve('../node_modules/zlib-browserify'),
      'bn.js': path.resolve('../node_modules/bn.js'),
      '@solana/web3.js': path.resolve('../node_modules/@solana/web3.js'),
      '@project-serum/serum': path.resolve(
        '../node_modules/@project-serum/serum'
      ),
      '@project-serum/anchor': path.resolve(
        '../node_modules/@project-serum/anchor'
      ),
      axios: path.resolve('../node_modules/axios'),
      buffer: path.resolve('../node_modules/buffer'),
      'buffer-layout': path.resolve('../node_modules/buffer-layout'),
      arweave: path.resolve('../node_modules/arweave'),
    }
    return config
  },
  env: {
    REACT_APP_CLUSTER: cluster,
    INDEXER_URL:
      cluster === 'devnet'
        ? 'https://api-dev.nina.market'
        : 'https://api.nina.market',
  },
  images: {
    domains: ['www.arweave.net', 'arweave.net'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    minimumCacheTTL: 60,
  },
})

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
