/**
 * 类型安全验证测试
 * 在 VS Code 中打开此文件，测试自动完成功能
 */

'use client';

import { useTranslations } from 'next-intl';

export function TypeSafetyTest() {
    // 测试 1: 基础自动完成
    // 在 t(' 后按 Ctrl+Space 应该看到所有 common 命名空间下的 key
    const tCommon = useTranslations('common');

    const test1 = tCommon('loading');     // ✅ 应该有自动完成
    const test2 = tCommon('error');       // ✅ 应该有自动完成
    const test3 = tCommon('success');     // ✅ 应该有自动完成

    // 测试 2: 嵌套路径自动完成
    // 应该提示 errors.ffmpegNotReady, errors.analysisFailed
    const test4 = tCommon('errors.ffmpegNotReady');

    // 测试 3: 进度相关翻译
    const tProgress = useTranslations('common.progress');
    const test5 = tProgress('initializing');
    const test6 = tProgress('configuring');

    // 测试 4: 带参数的翻译（类型检查）
    const test7 = tProgress('remainingSeconds', { seconds: 30 });
    const test8 = tProgress('remainingMinutes', { minutes: 5 });
    const test9 = tProgress('remainingMinutesSeconds', { minutes: 5, seconds: 30 });

    // 测试 5: 媒体处理器相关翻译
    const tMedia = useTranslations('mediaProcessor');
    const test10 = tMedia('videoToGif.title');
    const test11 = tMedia('videoToGif.description');

    // 测试 6: 导航相关
    const tNav = useTranslations('navigation');
    const test12 = tNav('home');
    const test13 = tNav('upload');

    // 测试 7: 首页翻译
    const tHome = useTranslations('home');
    const test14 = tHome('title');
    const test15 = tHome('description');

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">类型安全测试</h1>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">基础翻译</h2>
                <p>Loading: {test1}</p>
                <p>Error: {test2}</p>
                <p>Success: {test3}</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">嵌套翻译</h2>
                <p>Error Message: {test4}</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">进度翻译</h2>
                <p>{test5}</p>
                <p>{test6}</p>
                <p>{test7}</p>
                <p>{test8}</p>
                <p>{test9}</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">媒体处理器</h2>
                <p>{test10}</p>
                <p>{test11}</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">导航</h2>
                <p>{test12}</p>
                <p>{test13}</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">首页</h2>
                <p>{test14}</p>
                <p>{test15}</p>
            </div>

            <div className="mt-8 p-4 bg-green-100 dark:bg-green-900 rounded">
                <p className="font-semibold">✅ 如果你在 VS Code 中看到了自动完成提示，说明类型安全配置成功！</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>在 t(' 后按 Ctrl+Space 查看所有可用的 key</li>
                    <li>输入错误的 key 会有 TypeScript 错误提示</li>
                    <li>参数类型会被检查</li>
                </ul>
            </div>
        </div>
    );
}
