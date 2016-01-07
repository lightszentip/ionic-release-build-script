var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
require('shelljs/global');
var semver = require('semver');
var git = require('gulp-git');
var argv = require('yargs').argv;
var bump = require('gulp-bump');
var tag_version = require('gulp-tag-version');
var Q = require('q');
var moment = require("moment");
var filter = require('gulp-filter');
var xeditor = require("gulp-xml-editor");
var replace = require("gulp-replace");
var open = require("gulp-open");
var clean = require('gulp-clean');
var del = require('del');
var runSequence = require('run-sequence');
var args = require('yargs').argv;
var merge = require('gulp-merge');
var taskListing = require('gulp-task-listing');

/** Config start * */

var isPatch = args.envType === 'patch';
var isMinor = args.envType === 'minor';
var isMajor = args.envType === 'major';
var isPreRelease = args.envType === 'prerelease';

var isError = false;
var newVersion = "";

// the destination paths
var dest_paths = {
	release_builds : './release_builds'
};

/** Config ends * */

/** Ionic Tasks start * */
gulp.task('install', [ 'git-check' ], function() {
	return bower.commands.install().on('log', function(data) {
		gutil.log('bower', gutil.colors.cyan(data.id), data.message);
	});
});

gulp.task('git-check',	function(done) {
	if (!sh.which('git')) {
		console
				.log('  '+ gutil.colors.red('Git is not installed.'),
						'\n  Git, the version control system, is required to download Ionic.',
						'\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads')
						+ '.',	'\n  Once git is installed, run \''
						+ gutil.colors.cyan('gulp install')	+ '\' again.');
		process.exit(1);
	}
	done();
});

/** Ionic Tasks end * */
// Add a task to render the output
gulp.task('help', taskListing);

gulp.task('createNewRelease', function() {
	var changeType = 'patch';
	if (isMinor) {
		changeType = 'minor';
	} else if (isMajor) {
		changeType = 'major';
	} else if (isPreRelease) {
		changeType = 'prerelease';
	}
	var pkg = getPackageJson();
	// get existing version
	var oldVer = pkg.version;
	// increment version
	newVersion = getNewVersion(oldVer, changeType);
	var changeVersionResult = changeVersion(newVersion, oldVer);
	runSequence('cleanBuild', 'updateInfos', 'build-release', 'commitAndTag',
			function(err) {
				if (err) {
					echo("#####################ERROR###################");
					echo(err.message);
					echo("Error Task: " + err.task);
					echo("DOING ROLLBACK");
					changeVersion(oldVer, newVersion);
					echo("#####################ERROR###################");
				}
			});
})

gulp.task('cleanBuild', function() {
	return del([ './platforms/android/build/build/outputs/apk/*.apk',
			'./platforms/android/build/**/*' ]);
})

gulp.task('commitAndTag', function() {
	echo("--- No erros - build was success - commit and create a tag");
	return commitAndTag(newVersion);
})

gulp.task('updateInfos', function() {
	var pkg = getPackageJson();
	return gulp.src("./config.xml").pipe(xeditor([ {
		path : '//xmlns:name',
		text : pkg.name
	}, ], 'http://www.w3.org/ns/widgets')).pipe(xeditor([ {
		path : '//xmlns:author',
		text : pkg.author
	}, ], 'http://www.w3.org/ns/widgets')).pipe(xeditor([ {
		path : '//xmlns:author',
		attr : {
			email : pkg.authorEmail,
			href : pkg.authorUrl
		}
	}, ], 'http://www.w3.org/ns/widgets')).pipe(xeditor([ {
		path : '//xmlns:description',
		text : pkg.description
	}, ], 'http://www.w3.org/ns/widgets')).pipe(gulp.dest("./"));
})

gulp.task('versionPatch', function() {
	return changeVersionByType('patch');
})
gulp.task('versionFeature', function() {
	return changeVersionByType('minor');
})
gulp.task('versionRelease', function() {
	return changeVersionByType('major');
})
gulp.task('versionPrerelease', function() {
	return changeVersionByType('prerelease');
})


gulp.task('build-release', ['cleanBuild'],	function() {
	// remove the console plugin
	exec("cordova plugin rm org.apache.cordova.console");

	if (exec('cordova build --release android').code !== 0) {
		echo('Error: Android build failed');
		exit(1);
	} else {

		if (exec('$ANDROID_HOME/build-tools/23.0.2/zipalign -v 4 ./platforms/android/build/outputs/apk/android-release.apk ./platforms/android/build/outputs/apk/android-release-zipalign.apk').code !== 0) {
			echo('Error: Android zipalign failed');
			exit(1);
		}
		// copy the release output to release-builds/
		gulp
				.src(
						[ './platforms/android/build/outputs/apk/android-release-zipalign.apk' ])
				.pipe(
						rename(function(path) {
							var versionForFilename = newVersion;
							if(versionForFilename == ""){
								var pkg = getPackageJson();
								versionForFilename = pkg.version;
							}
							path.basename += "-"
									+ moment().format(
											'MMDDYYYY-hhmmss')
									+ "-" + versionForFilename;
						}))
				// do any other processing needed
				.pipe(gulp.dest(dest_paths.release_builds));

	}

	// re-add the console plugin
	exec("cordova plugin add org.apache.cordova.console");
});

// build a debug native version after compiling
gulp.task('build-debug', function() {
	if (exec('ionic build android').code !== 0) {
		echo('Error: Android build failed');
		exit(1);
	}
});

/** Functions * */
// `fs` is used instead of require to prevent caching in watch (require caches)
var fs = require('fs');
var getPackageJson = function() {
	return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
};

function changeVersionByType(changeType) {
	var pkg = getPackageJson();
	// get existing version
	var oldVer = pkg.version;
	var newVer = getNewVersion(oldVer, changeType);
	return changeVersion(newVer, oldVer);
}

function changeVersionConfigXml(oldVer, newVer) {
	return gulp.src("./config.xml").pipe(
			replace('version="' + oldVer + '"', 'version="' + newVer + '"'))
			.pipe(gulp.dest("./"));
}

function changeVersionConfigJson(oldVer, newVer) {
	return gulp.src([ './package.json' ]).pipe(bump({
		version : newVer
	})).pipe(gulp.dest('./'));
}

function getNewVersion(oldVer, changeType) {
	return semver.inc(oldVer, changeType);
}

function changeVersion(newVer, oldVer) {
	echo("Old Version " + oldVer);
	echo("New Version " + newVer);
	var xmlConfig = changeVersionConfigXml(oldVer, newVer);
	var jsonConfig = changeVersionConfigJson(oldVer, newVer);
	return merge(jsonConfig, xmlConfig);
}

function commitAndTag(newVersion) {
	var jsonFilter = filter('**/*.json', {
		restore : true
	});
	return gulp.src([ './package.json', './config.xml' ]).pipe(git.add())
	.pipe(jsonFilter)
	.pipe(bump({
		version : newVersion
	}))
	.pipe(gulp.dest('./'))
	.pipe(jsonFilter.restore)
	.pipe(git.commit('bump app version to ' + newVersion))
	.pipe(filter('package.json'))
	.pipe(tag_version());
}
