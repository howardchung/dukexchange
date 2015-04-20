var gulp = require('gulp');
var path = require('path');
var webpack = require('gulp-webpack');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var webpackConfig = require('./webpack.config.js');

gulp.task('style', function() {
  return gulp.src('./src/stylesheets/*.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest('public/css'));
});

gulp.task('js:build', function() {
  return gulp.src('./src/js/index.js')
    .pipe(webpack(webpackConfig))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

gulp.task('js:dev', function() {
  var devConfig = Object.create(webpackConfig);
  webpackConfig.watch = true;
  return gulp.src('./src/js/index.js')
    .pipe(webpack(devConfig))
    .pipe(gulp.dest('public/js'));
});

gulp.task('watch', ['style'], function() {
  gulp.watch('./src/stylesheets/**/*.scss', ['style']);
  gulp.start('js:dev');
});

gulp.task('default', ['style', 'js:build'], function() {
});
