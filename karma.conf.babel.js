import fs from 'fs'
import puppeteerPkg from 'puppeteer/package.json'
import Downloader from 'puppeteer/utils/ChromiumDownloader'
import config from './config'
import webpackConfig from './webpack.config.babel'

const revision = puppeteerPkg.puppeteer.chromium_revision
const revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), revision)

process.env.CHROME_BIN = revisionInfo.executablePath

const formatError = (msg) => {
  // filter out empty lines and node_modules
  if (!msg.trim() || /~/.test(msg) || /node_modules\//.test(msg)) return ''

  // indent the error beneath the it() message
  let newLine = `  ${msg}`

  if (newLine.includes('webpack:///')) {
    // remove webpack:///
    newLine = newLine.replace('webpack:///', '')

    // remove bundle location, showing only the source location
    newLine = newLine.slice(0, newLine.indexOf(' <- '))
  }

  return `${newLine}\n`
}

const basePath = __dirname
const { paths } = config

export default (karmaConfig) => {
  karmaConfig.set({
    basePath,
    browsers: ['ChromeHeadless'],
    browserConsoleLogOptions: {
      level: 'log',
      terminal: true,
    },
    client: {
      mocha: {
        reporter: 'html', // change Karma's debug.html to mocha web reporter
        ui: 'bdd',
      },
    },
    coverageReporter: {
      reporters: [
        { type: 'lcov', dir: 'coverage', subdir: '.' },
        { type: 'text-summary' },
      ],
      includeAllSources: true,
    },
    files: [
      { pattern: 'docs/app/logo.png', watched: false, included: false, served: true },
      { pattern: 'docs/app/assets/**/*.jpg', watched: false, included: false, served: true },
      { pattern: 'docs/app/assets/**/*.png', watched: false, included: false, served: true },
      './test/tests.bundle.js',
    ],
    formatError,
    frameworks: ['mocha'],
    // make karma serve all files that the web server does: /* => /docs/app/*
    proxies: fs.readdirSync(paths.docsSrc()).reduce((acc, file) => {
      const isDir = fs.statSync(paths.docsSrc(file)).isDirectory()
      const trailingSlash = isDir ? '/' : ''

      const original = `/${file}${trailingSlash}`
      acc[original] = `/base/docs/app/${file}${trailingSlash}`
      return acc
    }, {}),
    reporters: ['mocha', 'coverage'],
    reportSlowerThan: 100,
    singleRun: true,
    preprocessors: {
      // do not include 'coverage' preprocessor for karma-coverage
      // code is already instrumented by babel-plugin-__coverage__
      'test/tests.bundle.js': ['webpack'],
    },
    webpack: {
      entry: 'test/tests.bundle.js',
      externals: {
        ...webpackConfig.externals,
        // These are internal deps specific to React 0.13 required() by enzyme
        // They shouldn't be requiring these at all, issues and fix proposed
        // https://github.com/airbnb/enzyme/issues/285
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true,
        // this is a React 0.13 dep required by enzyme
        // ignore it since we don't have it
        'react/addons': true,
      },
      devtool: config.compiler_devtool,
      module: webpackConfig.module,
      plugins: webpackConfig.plugins,
      resolve: webpackConfig.resolve,
    },
    webpackServer: {
      progress: false,
      stats: config.compiler_stats,
      debug: true,
      noInfo: false,
      quiet: false,
    },
  })
}
