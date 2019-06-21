const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const gulpCleanCSS = require('gulp-clean-css');
const del = require('del');
const uglify = require('gulp-uglify-es').default;

const paths = {
  src: {
    html: 'src/views/*.html',
    scss: 'src/sass/*.scss',
    js: 'src/js/*.js',
  },
  dist: {
    main: './dist',
    html: 'dist/*.html',
    css: 'dist/*.css',
    js: 'dist/*.js',
  }
};

// 移除所有在 dist 資料夾中的檔案
function clean() {
  return del(['dist']);
}

// 將 HTML 檔搬移到 dist 資料夾
function moveHTML() {
  return gulp.src(paths.src.html).pipe(gulp.dest(paths.dist.main));
}

// 把 SASS 編譯成 CSS 檔
function compileSASS() {
  return gulp
    .src(['vendor/*.css', paths.src.scss], { sourcemaps: true })
    .pipe(sass())
    .pipe(concat('style.css'))
    .pipe(gulp.dest(paths.dist.main));
}

// 把 JS 檔載入
function concatJS() {
  return gulp
    .src(
      [
        paths.src.js
      ],
      { sourcemaps: true }
    )
    .pipe(concat('main.js'))
    .pipe(gulp.dest(paths.dist.main));
}

function serve(done) {
  browserSync.init({
    server: {
      baseDir: paths.dist.main
    }
  });

  done();
}

function liveReload(next) {
  browserSync.reload();
  next();
}

function watch() {
  // gulp.watch(<file-to-watch>, <task-to-run>)
  gulp.watch(paths.src.html, gulp.series(moveHTML, liveReload));
  gulp.watch(paths.src.scss, gulp.series(compileSASS, liveReload));
  gulp.watch(paths.src.js, gulp.series(concatJS, liveReload));
}

function uglifyJS() {
  return gulp.src(paths.dist.js)
    .pipe(uglify())      // time costed, production only
    .pipe(gulp.dest(paths.dist.main));
}

function cleanCSS() {
  return gulp.src(paths.dist.css)
  .pipe(gulpCleanCSS())
  .pipe(gulp.dest(paths.dist.main))
}

exports.clean = clean;

exports.default = gulp.series(
  clean,
  gulp.parallel(moveHTML, compileSASS, concatJS),
  serve,
  watch
);

exports.build = gulp.series(
  clean,
  gulp.parallel(moveHTML, compileSASS, concatJS),
  gulp.parallel(uglifyJS, cleanCSS)
);
