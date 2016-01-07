# ionic-release-build-script
Build script with gulp to release and create apk with ionic and new Version, also tasks to update the version and commit the changes.

## HowTo Preparation
* 1. Create a new Ionic Project or add the gulpfile.js to your ionic project
* 2. Add dependencies to your package.json 
```
  "devDependencies": {
      "bower": "^1.3.3",
      "del": "^2.2.0",
      "grunt": "^0.4.5",
      "gulp": "^3.9.0",
      "gulp-bump": "^1.0.0",
      "gulp-clean": "^0.3.1",
      "gulp-edit-xml": "^2.0.0",
      "gulp-filter": "^3.0.1",
      "gulp-git": "^1.6.1",
      "gulp-if": "^2.0.0",
      "gulp-jshint": "^2.0.0",
      "gulp-load-plugins": "^1.1.0",
      "gulp-merge": "^0.1.1",
      "gulp-open": "^1.0.0",
      "gulp-regex-replace": "^0.2.3",
      "gulp-replace": "^0.5.4",
      "gulp-tag-version": "^1.3.0",
      "gulp-task-listing": "^1.0.1",
      "gulp-uglify": "^1.5.1",
      "gulp-util": "^2.2.14",
      "gulp-xml-editor": "^2.2.1",
      "gulp-concat": "^2.2.0",
      "gulp-rename": "^1.2.0",
      "minimist": "^1.2.0",
      "moment": "^2.11.0",
      "q": "^1.4.1",
      "run-sequence": "^1.1.5",
      "semver": "^5.1.0",
      "shelljs": "^0.3.0",
      "yargs": "^3.31.0"
    },
```
* 3. Update your node modules with `npm install`
* 4. Add the following keys to your package.json (is necessary for config.xml and AndroidManifest.xml)
  "name": "nameofyourapp",
  "version": "VersionForYourAppForExample:0.0.1",
  "description": "DescriptionForYourApp",
  "author": "AuthorNAme",
  "authorEmail": "YourMailAddress",
  "authorUrl": "YourUrl",
* 5. Create a keystore for your ionic app
* 6. Create a new file under `platforms/android` with the name 'release-signing.properties' with content:
```
storeFile=pathtoyourkeystore/nameofyourkeystore.keystore
keyAlias=aliasname
storePassword=storepassword
keyPassword=keypassword
```
* 7. Call `gulp help` at your command line 

## Create a new apk with new version

Please call

`gulp createNewRelease --envType patch` for an new apk with new patch version

`gulp createNewRelease --envType minor` for an new apk with new minor version

`gulp createNewRelease --envType major` for an new apk with new major version

`gulp createNewRelease --envType prerelease` for an new apk with new prerelease version


The default envType is patch if you only call `gulp createNewRelease`

After a success build you find in `release_builds` a new apk with `android-release-zipalign-MMDDYYYY-hhmmss-versionnumber.apk` and a new tag with versionnumber.

## Tasks

```
Main Tasks
------------------------------
    cleanBuild
    commitAndTag
    createNewRelease
    help
    updateInfos
    versionFeature
    versionPatch
    versionPrerelease
    versionRelease

Sub Tasks
------------------------------
    build-debug
    build-release
```

* help: Show all tasks
* cleanBuild: Clean the build dir in platforms/Android
* commitAndTag: Create an new commit for config.xml and package.json and create a tag by version from package.json
* createNewRelease: Change the version in package.json, create a new android apk release and commit and tag the result.
* updateInfos: Change the author.*, description and name values in config.xml by package.json
* build-release: Create a new apk with the version from package.json without changes on versionnumber or git

For the following tasks read also http://semver.org/ (the version changes are only in config.xml and package.json - AndroidManifest is update by ionic release build)
* versionFeature: Set a new feature version - for example from 0.0.1 to 0.1.0 
* versionPatch: Set a new patch version - for example from 0.0.1 to 0.0.2
* versionPrerelease: Set a new prerelease version - for example from 0.1.0 to 1.0.0-1
* versionRelease: Set a new release version - for example from 1.0.5 to 2.0.0


