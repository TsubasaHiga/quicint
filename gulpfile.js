'use strict';

/**
 *
 * 初期設定（プラグイン読み込み、webpack設定、変数、入出力設定、環境依存設定など）
 *
 */

// プラグイン読み込み.
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const connectSSI = require('connect-ssi');
const css = require('gulp-sass');
const cssnano = require('cssnano');
const cssDeclarationSorter = require('css-declaration-sorter');
const crypto = require('crypto');
const dateutils = require('date-utils');
const del = require('del');
const ejs = require('gulp-ejs');
const fileinclude = require('gulp-file-include');
const fs = require('fs');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const mqpacker = require('css-mqpacker');
const newer = require('gulp-newer');
const notify = require('gulp-notify');
const packageImporter = require('node-sass-package-importer');
const plumber = require('gulp-plumber');
const pngquant = require('imagemin-pngquant');
const postcss = require('gulp-postcss');
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const zip = require('gulp-zip');

require('date-utils');

// 環境設定ファイルの読み込み.
const env = JSON.parse(fs.readFileSync('./env.json', 'utf8'));

// webpackの設定ファイルの読み込み.
const webpackConfig = require('./webpack.config');
const webpackConfig_build = require('./webpack.production.config');

// BrowserSync - sync.
const sync = () => browserSync.init(env.browsersync);

// BrowserSync - reload.
const reload = cb => {
  browserSync.reload();
  cb();
};

// Clean.
const clean = () => {
  return del(env.io.output.img + '**/*.{png,jpg,gif,svg}');
};

// Scss compile.
const scss = () => {
  return gulp
    .src(env.io.input.css + '**/*.scss')
    .pipe(
      plumber({
        errorHandler : err => {
          console.log(err.messageFormatted);
          this.emit('end');
        }
      })
    )
    .pipe(sourcemaps.init())
    .pipe(
      css({
        precision : 5,
        importer  : packageImporter({
          extensions : ['.scss', '.css']
        })
      })
    )
    .pipe(autoprefixer({}))
    .pipe(
      postcss([
        mqpacker(),
        cssnano({ autoprefixer : false }),
        cssDeclarationSorter({
          order : 'smacss'
        })
      ])
    )
    .pipe(sourcemaps.write('/maps'))
    .pipe(gulp.dest(env.io.output.css))
    .pipe(browserSync.stream());
};

// EJS
const ejsCompile = () => {
  // サイト設定ファイルの読み込み.
  let siteSetting = JSON.parse(fs.readFileSync('./setting.json', 'utf8'));

  // 乱数生成
  let revision = crypto.randomBytes(8).toString('hex');

  return (
    gulp
      .src([
        env.io.input.ejs + '**/*.ejs',
        '!' + env.io.input.ejs + '**/_*.ejs'
      ])
      .pipe(
        ejs(
          {
            node_env    : process.env.NODE_ENV,
            siteSetting : siteSetting
          },
          {},
          { ext : '.html' }
        )
      )
      .pipe(rename({ extname : '.html' }))
      .pipe(htmlmin(env.htmlmin))
      .pipe(
        replace(/\.(js|css|gif|jpg|jpeg|png|svg)\?rev/g, '.$1?rev=' + revision)
      )

      .pipe(gulp.dest(env.io.output.html))
  );
};

// Img compressed.
const img = () => {
  return gulp
    .src(env.io.input.img + '**/*.{png,jpg,gif,svg}')
    .pipe(
      plumber({
        errorHandler : err => {
          console.log(err.messageFormatted);
          this.emit('end');
        }
      })
    )
    .pipe(newer(env.io.output.img)) //srcとdistを比較して異なるものだけ処理
    .pipe(
      imagemin([
        pngquant({
          quality : [0.5, 0.9],
          speed   : 1,
          floyd   : 0
        }),
        mozjpeg({
          quality     : 85,
          progressive : true
        }),
        imagemin.svgo(),
        imagemin.optipng(),
        imagemin.gifsicle()
      ])
    )
    .pipe(gulp.dest(env.io.output.img));
};

// WebpackStream.
const js = () => {
  return gulp
    .src(env.io.input.js + '**/*.js')
    .pipe(
      plumber({
        errorHandler : err => {
          console.log(err.messageFormatted);
          this.emit('end');
        }
      })
    )
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest(env.io.output.js))
    .pipe(browserSync.stream());
};

// WebpackStream build
const jsBuild = () => {
  return gulp
    .src(env.io.input.js + '**/*.js')
    .pipe(
      plumber({
        errorHandler : err => {
          console.log(err.messageFormatted);
          this.emit('end');
        }
      })
    )
    .pipe(webpackStream(webpackConfig_build, webpack))
    .pipe(gulp.dest(env.io.output.js));
};

// Watch files.
const watch = () => {
  gulp.watch(env.io.input.css + '**/*.scss', scss);
  gulp.watch(env.io.input.img + '**/*', img);
  gulp.watch(env.io.input.js + '**/*.js', js);
  gulp.watch(
    env.io.input.ejs + '**/*.ejs',
    { interval : 250 },
    gulp.series(ejsCompile, reload)
  );
};

// 納品ディレクトリ作成
const genDir = (dirname) => {
  dirname = (typeof dirname !== 'undefined') ? dirname : 'publish_data';
  let distname = 'dist';
  return gulp
    .src([
      distname + '/**/*',
      '!' + distname + '/**/maps',
      '!' + distname + '/**/*.map',
      '!' + distname + '/**/*.DS_Store',
      '!' + distname + '/**/*.LICENSE',
      '!' + distname + '/**/*Thumbs.db'
    ])
    .pipe(zip(dirname + '.zip'))
    .pipe(gulp.dest(env.publishDir))
    .pipe(
      notify({
        title   : '納品データを作成しました 👍',
        message : '出力先：' + env.publishDir + dirname + '.zip'
      })
    );
};

// 納品タスク
const filePackage = (cb) => {
  // サイト設定ファイルの読み込み.
  const siteSetting = JSON.parse(fs.readFileSync('./setting.json', 'utf8'));

  // 納品ファイル作成
  let dt = new Date();
  let date = dt.toFormat('YYMMDD-HHMI');
  let dirname = 'publish__' + date + '__' + siteSetting.publishFileName;
  genDir(dirname);
  cb();
}

exports.default = gulp.parallel(watch, sync);
exports.img_reset = gulp.series(clean, img);
exports.publish = gulp.series(scss, ejsCompile, jsBuild, filePackage, js);
