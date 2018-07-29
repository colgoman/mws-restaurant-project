// including plugins
var gulp = require('gulp')
    , minifyHtml = require("gulp-minify-html");

// task
gulp.task('minify-html', function () {
    gulp.src('./src/*.html') // path to your files
        .pipe(minifyHtml())
        .pipe(gulp.dest('./dist/'));
});

// including plugins
var gulp = require('gulp')
    , minifyCss = require("gulp-minify-css");

// task
gulp.task('minify-css', function () {
    gulp.src('./src/css/*.css') // path to your file
        .pipe(minifyCss())
        .pipe(gulp.dest('./dist/css/'));
});

// including plugins
var gulp = require('gulp')
    , uglify = require("gulp-uglify-es").default;

// task
gulp.task('minify-js', function () {
    gulp.src('./src/js/*.js') // path to your files
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js/'));
});