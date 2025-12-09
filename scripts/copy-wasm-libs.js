#!/usr/bin/env node
/**
 * 复制 WASM 库文件到 public 目录
 * 包括 wasm-vips 和 @ffmpeg/core
 * 在 postinstall 或构建前运行
 */

const fs = require('fs');
const path = require('path');

// 配置
const LIBS_CONFIG = {
    'vips': {
        sourceDir: path.join(__dirname, '../node_modules/wasm-vips/lib'),
        targetDir: path.join(__dirname, '../public/wasm-libs/vips'),
        files: [
            'vips-es6.js',
            'vips.wasm',
            'vips.js',
            // 可选的动态库（如果需要 HEIF/JXL 支持，取消注释）
            // 'vips-heif.wasm',
            // 'vips-jxl.wasm',
            // 'vips-resvg.wasm',
        ]
    },
    'ffmpeg': {
        sourceDir: path.join(__dirname, '../node_modules/.pnpm/@ffmpeg+core-mt@0.12.10/node_modules/@ffmpeg/core-mt/dist/umd'),
        targetDir: path.join(__dirname, '../public/wasm-libs/ffmpeg'),
        files: [
            'ffmpeg-core.js',
            'ffmpeg-core.wasm',
            'ffmpeg-core.worker.js',
        ]
    }
};

/**
 * 复制单个库的文件
 */
function copyLibrary(libName, config) {
    console.log(`\n[copy-wasm-libs] 📦 处理 ${libName}...`);

    // 检查源目录是否存在
    if (!fs.existsSync(config.sourceDir)) {
        console.warn(`[copy-wasm-libs] ⚠️  ${libName} 源目录不存在，跳过: ${config.sourceDir}`);
        return 0;
    }

    // 创建目标目录
    if (!fs.existsSync(config.targetDir)) {
        fs.mkdirSync(config.targetDir, { recursive: true });
        console.log(`[copy-wasm-libs] 📁 创建目录: ${config.targetDir}`);
    }

    // 复制文件
    let copiedCount = 0;
    let totalSize = 0;

    for (const file of config.files) {
        const sourcePath = path.join(config.sourceDir, file);
        const targetPath = path.join(config.targetDir, file);

        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            const stats = fs.statSync(targetPath);
            const sizeKB = (stats.size / 1024).toFixed(1);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            totalSize += stats.size;

            const displaySize = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
            console.log(`[copy-wasm-libs]   ✓ ${file} (${displaySize})`);
            copiedCount++;
        } else {
            console.warn(`[copy-wasm-libs]   ⊘ ${file} (文件不存在)`);
        }
    }

    const totalMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`[copy-wasm-libs] ✅ ${libName} 完成! 共 ${copiedCount} 个文件，总计 ${totalMB} MB`);

    return copiedCount;
}

/**
 * 主函数
 */
function copyWasmLibs() {
    console.log('='.repeat(60));
    console.log('[copy-wasm-libs] 🚀 开始复制 WASM 库文件...');
    console.log('='.repeat(60));

    let totalCopied = 0;
    const startTime = Date.now();

    // 复制所有库
    for (const [libName, config] of Object.entries(LIBS_CONFIG)) {
        try {
            totalCopied += copyLibrary(libName, config);
        } catch (error) {
            console.error(`[copy-wasm-libs] ❌ 复制 ${libName} 时出错:`, error.message);
            // 继续处理其他库，不中断整个流程
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(`[copy-wasm-libs] 🎉 全部完成! 共复制 ${totalCopied} 个文件，耗时 ${duration}s`);
    console.log('='.repeat(60));

    // 如果没有复制任何文件，给出警告
    if (totalCopied === 0) {
        console.warn('\n⚠️  警告: 没有复制任何文件，请检查依赖是否已安装 (运行 pnpm install)');
    }
}

// 执行复制
try {
    copyWasmLibs();
} catch (error) {
    console.error('[copy-wasm-libs] ❌ 发生严重错误:', error);
    process.exit(1);
}
