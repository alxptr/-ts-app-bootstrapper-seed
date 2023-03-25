// Forked from https://github.com/AngularClass/angular2-webpack-starter

const webpack = require('webpack');
const helpers = require('./helpers');

/*
 * Webpack Plugins
 */
// problem with copy-webpack-plugin
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;
const HtmlElementsPlugin = require('./html-elements-plugin');

/*
 * Webpack Constants
 */
const METADATA = {
	isDevServer: helpers.isWebpackDevServer()
};

/*
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function(options) {
	isProd = options.env === 'production';
	return {

		/*
		 * Static metadata for index.html
		 *
		 * See: (custom attribute)
		 */
		metadata: METADATA,

		/*
		 * The entry point for the bundle
		 * Our Angular.js app
		 *
		 * See: http://webpack.github.io/docs/configuration.html#entry
		 */
		entry: {
			'bootstrapper':      './src/main.browser.ts'
		},

		/*
		 * Options affecting the resolving of modules.
		 *
		 * See: http://webpack.github.io/docs/configuration.html#resolve
		 */
		resolve: {

			/*
			 * An array of extensions that should be used to resolve modules.
			 *
			 * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
			 */
			extensions: ['', '.ts', '.js', '.json'],

			// An array of directory names to be resolved to the current directory
			modules: [helpers.root('src'), 'node_modules'],

		},

		/*
		 * Options affecting the normal modules.
		 *
		 * See: http://webpack.github.io/docs/configuration.html#module
		 */
		module: {
			
			/*
			 * An array of automatically applied loaders.
			 *
			 * IMPORTANT: The loaders here are resolved relative to the resource which they are applied to.
			 * This means they are not resolved relative to the configuration file.
			 *
			 * See: http://webpack.github.io/docs/configuration.html#module-loaders
			 */
			loaders: [

				/*
				 * Typescript loader support for .ts and Angular 2 async routes via .async.ts
				 * Replace templateUrl and stylesUrl with require()
				 *
				 * See: https://github.com/s-panferov/awesome-typescript-loader
				 * See: https://github.com/TheLarkInn/angular2-template-loader
				 */
				{
					test: /\.ts$/,
					loaders: [
						'awesome-typescript-loader'
					],
					exclude: [/\.(spec|e2e)\.ts$/]
				}
			]
		},

		/*
		 * Add additional plugins to the compiler.
		 *
		 * See: http://webpack.github.io/docs/configuration.html#plugins
		 */
		plugins: [

			/*
			 * Plugin: ForkCheckerPlugin
			 * Description: Do type checking in a separate process, so webpack don't need to wait.
			 *
			 * See: https://github.com/s-panferov/awesome-typescript-loader#forkchecker-boolean-defaultfalse
			 */
			new ForkCheckerPlugin(),

			/*
			 * Plugin: HtmlWebpackPlugin
			 * Description: Simplifies creation of HTML files to serve your webpack bundles.
			 * This is especially useful for webpack bundles that include a hash in the filename
			 * which changes every compilation.
			 *
			 * See: https://github.com/ampedandwired/html-webpack-plugin
			 */
			new HtmlWebpackPlugin({
				template: 'src/index.html',
				chunksSortMode: 'dependency'
			}),

			/*
			 * Plugin: HtmlHeadConfigPlugin
			 * Description: Generate html tags based on javascript maps.
			 *
			 * If a publicPath is set in the webpack output configuration, it will be automatically added to
			 * href attributes, you can disable that by adding a "=href": false property.
			 * You can also enable it to other attribute by settings "=attName": true.
			 *
			 * The configuration supplied is map between a location (key) and an element definition object (value)
			 * The location (key) is then exported to the template under then htmlElements property in webpack configuration.
			 *
			 * Example:
			 *  Adding this plugin configuration
			 *  new HtmlElementsPlugin({
			 *    headTags: { ... }
			 *  })
			 *
			 *  Means we can use it in the template like this:
			 *  <%= webpackConfig.htmlElements.headTags %>
			 *
			 * Dependencies: HtmlWebpackPlugin
			 */
			new HtmlElementsPlugin({
				headTags: require('./head-config.common')
			}),

		],

		/*
		 * Include polyfills or mocks for various node stuff
		 * Description: Node configuration
		 *
		 * See: https://webpack.github.io/docs/configuration.html#node
		 */
		node: {
			global: 'window',
			crypto: 'empty',
			process: true,
			module: false,
			clearImmediate: false,
			setImmediate: false
		}

	};
};