// 实现这个项目的构建任务
const { src, dest, parallel, series, watch } = require("gulp");

// 引入gulp-sass
// const sass = require("gulp-sass");
// // 引入js转换
// const babel = require("gulp-babel");
// // 引入页面编译模块
// const swig = require("gulp-swig");
// // 引入字体图片转换
// const imagemin = require("gulp-imagemin");
// 引入清除插件
const del = require("del");
// 自动载入插件（仅适用于gulp插件）
const loadPlugins = require("gulp-load-plugins");
const plugins = loadPlugins();
// const uglify = require("gulp-uglify");

// 引入热更新
const browserSync = require("browser-sync");
const bs = browserSync.create();

// 获取项目配置数据
// 获取项目
const cwd = process.cwd();
let config = {
  // default config
  build: {
    src: "src",
    dist: "dist",
    temp: "temp",
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      scripts: "assets/scripts/*.js",
      pages: "*.html",
      images: "assets/images/**",
      fonts: "assets/fonts/**",
    },
  },
};

try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig);
} catch (e) {}

// 清除任务
const clean = () => {
  return del([config.build.dist, config.build.temp]);
};

// 拷贝public中文件
const extra = () => {
  return src("**", {
    base: config.build.public,
    cwd: config.build.public,
  }).pipe(dest(config.build.dist));
};

const image = () => {
  return src(config.build.paths.images, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};

const font = () => {
  return src(config.build.paths.fonts, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};

const style = () => {
  return src(config.build.paths.styles, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.sass({ outputStyle: "expanded" }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

const script = () => {
  return src(config.build.paths.scripts, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.babel({ presets: [require("@babel/preset-env")] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

const page = () => {
  console.log(config);
  return src(config.build.paths.pages, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.swig({ data: config.data, default: { caches: false } }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

// 热更新任务
const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false, // 关闭页面提示
    port: 2080,
    files: "/dist/**", // 监听路径
    server: {
      baseDir: [config.build.temp, config.build.dist, config.build.public], // 网站访问根目录
      // 将node_modules指定目录，这样请求会自动找到位置
      routes: {
        "/node_modules": "node_modules",
      },
    },
  });
};

// 压缩任务
const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, "."] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true, // 清除空格字符（包括换行)
          minifyCSS: true, // 压缩htm中内部标签的css
          minifyJS: true, // 压缩htm中内部标签的js
        })
      )
    )
    .pipe(dest(config.build.dist));
};

// 组合任务,并行
const compile = parallel(style, script, page);
// 先清除，再打包
const build = series(
  clean,
  parallel(series(compile, useref), font, image, extra)
);
// 先重新生成dist，再启动服务并监听
const develop = series(compile, serve);
module.exports = {
  compile,
  build,
  develop,
};
