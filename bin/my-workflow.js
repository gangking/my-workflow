#!/usr/bin/env node

// 命令行路径参数设置
process.argv.push('--cwd')
// 加入当前命令行路径
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
// 载入这个模块
process.argv.push(require.resolve('..'))

// 思路：按照 gulp.cmd文件去设置
require('gulp/bin/gulp')
