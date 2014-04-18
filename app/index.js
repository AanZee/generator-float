'use strict';
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var yeoman = require('yeoman-generator');
var chalk = require('chalk');

var AppGenerator = module.exports = function Appgenerator(args, options, config) {
	yeoman.generators.Base.apply(this, arguments);

	// Setup the test-framework property, gulpfile template will need this
	this.testFramework = options['test-framework'] || 'mocha';

	// for hooks to resolve on mocha by default
	options['test-framework'] = this.testFramework;

	// resolved to mocha by default (could be switched to jasmine for instance)
	this.hookFor('test-framework', {
		as: 'app',
		options: {
			options: {
				'skip-install': options['skip-install-message'],
				'skip-message': options['skip-install']
			}
		}
	});

	this.options = options;
	this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(AppGenerator, yeoman.generators.Base);

// Ask questions
AppGenerator.prototype.askFor = function askFor() {
	var cb = this.async();

	// Welcome message
	if (!this.options['skip-welcome-message']) {
		console.log(chalk.red('            _~       '));
		console.log(chalk.red('         _~)_) _~    '));
		console.log(chalk.red('        )_))_))_)    '));
		console.log(chalk.yellow('        _!__!__!_    '));
		console.log(chalk.cyan('~~~~~~~~') + chalk.yellow('\\_____') + chalk.white('t') + chalk.yellow('_/') + chalk.cyan('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ FLOAT ~~~~~~~~'));
		console.log(chalk.red("Ahoy! You wanna be a real pirate!? Answer the next questions and you're in!"));
	}

	// Questions
	var prompts = [{
		name: 'siteName',
		message: 'Please enter the name of the site'
	},{
		type: 'confirm',
		name: 'includeBourbon',
		message: 'SASS is a default, do you want Bourbon?',
		default: true
	},{
		type: 'checkbox',
		name: 'features',
		message: 'Which features would you like to include',
		choices: [
			{
				name: "Modernizr",
				value: "modernizr"
			},
			{
				name: "Grid system",
				value: "grid"
			},
			{
				name: "Icon font",
				value: "iconfont"
			},
			{
				name: "Web font",
				value: "webfont"
			}
		]
	},{
		type: 'list',
		when: function (response) {
			return response.features.indexOf('iconfont') !== -1;
		},
		name: 'whichIconFont',
		message: 'Which icon font do you want to include?',
		choices: [
			{
				name: "Font Awesome",
				value: "font-awesome"
			}, 
			{
				name: "Foundicons",
				value: "foundicons"
			}
		]
	},{
		type: 'list',
		when: function (response) {
			return response.features.indexOf('webfont') !== -1;
		},
		name: 'whichWebFont',
		message: 'Which web font do you want to include?',
		choices: [
			{
				name: "Open Sans",
				value: "open-sans"
			}
		]
	}];

	// Ask the questions
	this.prompt(prompts, function (answers) {
		// Define a features array
		var features = answers.features;

		// Add custome feature questions
		if(answers.includeBourbon) {
			features.push('bourbon');
		}

		// Define site name
		this.siteName = answers.siteName;

		// Function to check if a feature needs to be included
		this.includeFeature = function(feat) {
			return features.indexOf(feat) !== -1;
		}

		// Function to check if and if so, which font needs to be included
		this.includeIconFont = function(font) {
			return includeFeature('iconfont') ? font === answers.whichIconFont : false;
		}

		// Other vars
		this.includeIconFontName = answers.whichIconFont;

		cb();
	}.bind(this));
};

// Process Gulpfile
AppGenerator.prototype.gulpfile = function gulpfile() {
	this.template('gulpfile.js');
};

// Process Package file (for NPM)
AppGenerator.prototype.packageJSON = function packageJSON() {
	this.template('_package.json', 'package.json');
};

// Process Git files
AppGenerator.prototype.git = function git() {
	this.copy('gitignore', '.gitignore');
	this.copy('gitattributes', '.gitattributes');
};

// Process Bower files
AppGenerator.prototype.bower = function bower() {
	this.copy('bowerrc', '.bowerrc');
	this.copy('bower.json', 'bower.json');
};

// Process JSHint file (js code linting)
AppGenerator.prototype.jshint = function jshint() {
	this.copy('jshintrc', '.jshintrc');
};

// Process EditorConfig file (rules for the editor)
AppGenerator.prototype.editorConfig = function editorConfig() {
	this.copy('editorconfig', '.editorconfig');
};

// Process stylesheets
AppGenerator.prototype.mainStylesheet = function mainStylesheet() {
	var css = 'style.scss';
	this.copy(css, 'app/styles/' + css);
};

// Process index file
AppGenerator.prototype.writeIndex = function writeIndex() {
	this.indexFile = this.readFileAsString(path.join(this.sourceRoot(), 'index.html'));
	this.indexFile = this.engine(this.indexFile, this);

	this.indexFile = this.appendFiles({
		html: this.indexFile,
		fileType: 'js',
		optimizedPath: 'scripts/app.js',
		sourceFileList: ['scripts/app.js']
	});
};

// Process app dirs & files
AppGenerator.prototype.app = function app() {
	this.mkdir('app');
	this.mkdir('app/scripts');
	this.mkdir('app/styles');
	this.mkdir('app/images');
	this.write('app/index.html', this.indexFile);
	this.write('app/scripts/app.js', 'console.log(\'Welcome to Float!\');');
};

// Install runner
AppGenerator.prototype.install = function () {
	if (this.options['skip-install']) {
		return;
	}

	var done = this.async();
	this.installDependencies({
		skipMessage: this.options['skip-install-message'],
		skipInstall: this.options['skip-install'],
		callback: done
	});
};
