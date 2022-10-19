#!/usr/bin/env node

const {
  program
} = require('commander');

program
  .version(require('../package.json').version, '-v, -V', '输出当前框架的版本')
  .description('重复造轮子之nmi')
  .usage('<command> [options]')
  .parse(process.argv)

program.command('help')
    .alias('-h')
    .description('帮助命令')
    .action(function(name, other) {
        console.log(`类umi脚手架

支持的命令:
  version, -v,-V 输出当前框架的版本
  help,-h 输出帮助程序

Example call:
    $ nmi <command> --help`)
    }).parse(process.argv);
