const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const concat = require('gulp-concat')
const browserSync = require('browser-sync').create()
const sass = require('gulp-sass')
const cleanCSS = require('gulp-clean-css')

// Static Server + watching scss/html files
gulp.task('serve', ['move-html', 'sass', 'concat-js'], function () {
  browserSync.init({
    server: './dist'
  })

  gulp.watch('src/views/*.html', ['browser-reload'])
  gulp.watch('src/sass/*.scss', ['browser-reload'])
  gulp.watch('src/js/*.js', ['browser-reload'])
})

gulp.task('browser-reload', ['move-html', 'sass', 'concat-js'], function () {
  browserSync.stream()
})

//  將不同的 js 檔案合併在同一支當中
gulp.task('concat-js', function () {
  return gulp.src([
    'vendor/jquery-3.2.1.min.js',
    'vendor/popper.min.js',
    'vendor/bootstrap.min.js',
    'src/js/*.js'
  ])
        .pipe(concat('main.js'))
        .pipe(gulp.dest('./dist'))
})

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function () {
  return gulp.src(['./vendor/*.css', 'src/sass/*.scss'])
        .pipe(sass())
        .pipe($.autoprefixer({
          browsers: ['last 2 versions', 'ie >= 9']
        }))
        .pipe(concat('style.css'))
        .pipe(gulp.dest('./dist'))
})

//  Move HTML to dist folder
gulp.task('move-html', function () {
  return gulp.src('src/views/*.html')
        .pipe(gulp.dest('./dist'))
        .pipe(browserSync.stream())
})

gulp.task('default', ['serve'])
