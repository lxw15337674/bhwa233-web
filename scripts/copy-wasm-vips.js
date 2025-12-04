#!/usr/bin/env node
/**
 * 复制 wasm-vips 文件到 public 目录
 * 在 postinstall 或构建前运行
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../node_modules/wasm-vips/lib');
const TARGET_DIR = path.join(__dirname, '../public/wasm-vips');

// 需要复制的文件
const FILES = [
    'vips-es6.js',
    'vips.wasm',
    'vips.js',
    // 可选的动态库（如果需要 HEIF/JXL 支持，取消注释）
    // 'vips-heif.wasm',
    // 'vips-jxl.wasm',
    // 'vips-resvg.wasm',
];

function copyWasmVips() {
    console.log('[copy-wasm-vips] 开始复制 wasm-vips 文件...');

    // 检查源目录是否存在
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error('[copy-wasm-vips] 错误: wasm-vips 未安装，请先运行 pnpm install');
        process.exit(1);
    }

    // 创建目标目录
    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
        console.log('[copy-wasm-vips] 创建目录:', TARGET_DIR);
    }

    // 复制文件
    let copiedCount = 0;
    for (const file of FILES) {
        const sourcePath = path.join(SOURCE_DIR, file);
        const targetPath = path.join(TARGET_DIR, file);

        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            const stats = fs.statSync(targetPath);
            const sizeKB = (stats.size / 1024).toFixed(1);
            console.log(`[copy-wasm-vips] 复制: ${file} (${sizeKB} KB)`);
            copiedCount++;
        } else {
            console.warn(`[copy-wasm-vips] 跳过: ${file} (文件不存在)`);
        }
    }

    console.log(`[copy-wasm-vips] 完成! 共复制 ${copiedCount} 个文件`);
}

copyWasmVips();
