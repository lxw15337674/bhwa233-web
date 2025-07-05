import axios, { AxiosResponse } from 'axios';

const UPLOAD_URL = 'https://telegraph-image-bww.pages.dev/upload';

interface TestResult {
    test: string;
    success: boolean;
    details: any;
    error?: string;
}

class StreamingUploadTester {
    private results: TestResult[] = [];

    // 创建测试文件
    private createTestFile(size: number = 1024 * 1024): Uint8Array {
        const testData = 'This is a test file for streaming upload testing. '.repeat(Math.ceil(size / 50));
        return new TextEncoder().encode(testData.slice(0, size));
    }

    // 1. 测试 Transfer-Encoding: chunked 支持
    async testChunkedTransfer(): Promise<TestResult> {
        try {
            const testFile = this.createTestFile(1024 * 10); // 10KB

            // 创建可读流
            const stream = new ReadableStream({
                start(controller) {
                    const chunkSize = 1024; // 1KB chunks
                    let offset = 0;

                    const pushChunk = () => {
                        if (offset >= testFile.length) {
                            controller.close();
                            return;
                        }

                        const chunk = testFile.slice(offset, offset + chunkSize);
                        controller.enqueue(chunk);
                        offset += chunkSize;

                        // 模拟流式传输延迟
                        setTimeout(pushChunk, 10);
                    };

                    pushChunk();
                }
            });

            const response = await axios.post(UPLOAD_URL, stream, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Transfer-Encoding': 'chunked',
                    'Content-Length': testFile.length.toString()
                },
                timeout: 30000,
                validateStatus: () => true
            });

            return {
                test: 'Chunked Transfer Encoding',
                success: response.status < 400,
                details: {
                    statusCode: response.status,
                    responseHeaders: response.headers,
                    responseData: response.data
                }
            };
        } catch (error: any) {
            return {
                test: 'Chunked Transfer Encoding',
                success: false,
                details: {},
                error: error.message
            };
        }
    }

    // 2. 测试 Range 请求支持
    async testRangeRequests(): Promise<TestResult> {
        try {
            const response = await axios.get(UPLOAD_URL, {
                headers: {
                    'Range': 'bytes=0-1023'
                },
                timeout: 10000,
                validateStatus: () => true
            });

            const acceptRanges = response.headers['accept-ranges'];
            const contentRange = response.headers['content-range'];
            const isPartialContent = response.status === 206;

            return {
                test: 'Range Request Support',
                success: Boolean(acceptRanges || contentRange || isPartialContent),
                details: {
                    statusCode: response.status,
                    acceptRanges,
                    contentRange,
                    isPartialContent,
                    headers: response.headers
                }
            };
        } catch (error: any) {
            return {
                test: 'Range Request Support',
                success: false,
                details: {},
                error: error.message
            };
        }
    }

    // 3. 测试流式上传 - 使用 ReadableStream
    async testStreamingUpload(): Promise<TestResult> {
        try {
            const testFile = this.createTestFile(1024 * 50); // 50KB

            // 创建模拟流式上传
            const stream = new ReadableStream({
                start(controller) {
                    let offset = 0;
                    const chunkSize = 1024; // 1KB chunks

                    const pushChunk = () => {
                        if (offset >= testFile.length) {
                            controller.close();
                            return;
                        }

                        const chunk = testFile.slice(offset, offset + chunkSize);
                        controller.enqueue(chunk);
                        offset += chunkSize;

                        // 模拟网络延迟
                        setTimeout(pushChunk, 5);
                    };

                    pushChunk();
                }
            });

            const formData = new FormData();
            formData.append('file', new Blob([testFile]), 'test-streaming.txt');

            const response = await axios.post(UPLOAD_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Streaming-Upload': 'true'
                },
                timeout: 30000,
                validateStatus: () => true
            });

            return {
                test: 'Streaming Upload with ReadableStream',
                success: response.status < 400,
                details: {
                    statusCode: response.status,
                    responseHeaders: response.headers,
                    responseData: response.data
                }
            };
        } catch (error: any) {
            return {
                test: 'Streaming Upload with ReadableStream',
                success: false,
                details: {},
                error: error.message
            };
        }
    }

    // 4. 测试大文件上传 - 检查内存使用
    async testLargeFileUpload(): Promise<TestResult> {
        try {
            const largeFile = this.createTestFile(1024 * 1024 * 5); // 5MB

            console.log('开始上传5MB文件...');
            const startTime = Date.now();
            const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

            const formData = new FormData();
            formData.append('file', new Blob([largeFile]), 'test-large.txt');

            const response = await axios.post(UPLOAD_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000,
                validateStatus: () => true
            });

            const endTime = Date.now();
            const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
            const memoryUsed = endMemory - startMemory;

            return {
                test: 'Large File Upload (5MB)',
                success: response.status < 400,
                details: {
                    statusCode: response.status,
                    uploadTime: `${endTime - startTime}ms`,
                    memoryUsed: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
                    responseHeaders: response.headers,
                    responseData: response.data
                }
            };
        } catch (error: any) {
            return {
                test: 'Large File Upload (5MB)',
                success: false,
                details: {},
                error: error.message
            };
        }
    }

    // 5. 测试分片上传 - 模拟流式传输
    async testChunkedStreamingUpload(): Promise<TestResult> {
        try {
            const testFile = this.createTestFile(1024 * 100); // 100KB
            const chunkSize = 1024 * 10; // 10KB chunks
            const chunks: Uint8Array[] = [];

            // 分割文件
            for (let i = 0; i < testFile.length; i += chunkSize) {
                chunks.push(testFile.slice(i, i + chunkSize));
            }

            console.log(`文件已分割为 ${chunks.length} 个分片`);

            // 模拟分片上传
            const uploadPromises = chunks.map(async (chunk, index) => {
                const formData = new FormData();
                formData.append('file', new Blob([chunk]), `chunk-${index}.txt`);

                return axios.post(UPLOAD_URL, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-Chunk-Index': index.toString(),
                        'X-Total-Chunks': chunks.length.toString(),
                        'X-Chunk-Size': chunkSize.toString()
                    },
                    timeout: 10000,
                    validateStatus: () => true
                });
            });

            const responses = await Promise.all(uploadPromises);
            const successCount = responses.filter(r => r.status < 400).length;

            return {
                test: 'Chunked Streaming Upload',
                success: successCount === chunks.length,
                details: {
                    totalChunks: chunks.length,
                    successfulChunks: successCount,
                    chunkSize: `${chunkSize / 1024}KB`,
                    responses: responses.map(r => ({
                        status: r.status,
                        headers: r.headers
                    }))
                }
            };
        } catch (error: any) {
            return {
                test: 'Chunked Streaming Upload',
                success: false,
                details: {},
                error: error.message
            };
        }
    }

    // 6. 测试服务器对流式传输的响应头
    async testStreamingHeaders(): Promise<TestResult> {
        try {
            const response = await axios.head(UPLOAD_URL, {
                timeout: 10000,
                validateStatus: () => true
            });

            const headers = response.headers;
            const streamingSupport = {
                transferEncoding: headers['transfer-encoding'],
                contentEncoding: headers['content-encoding'],
                acceptRanges: headers['accept-ranges'],
                contentLength: headers['content-length'],
                connection: headers['connection']
            };

            return {
                test: 'Streaming Headers Analysis',
                success: true,
                details: {
                    statusCode: response.status,
                    streamingSupport,
                    allHeaders: headers
                }
            };
        } catch (error: any) {
            return {
                test: 'Streaming Headers Analysis',
                success: false,
                details: {},
                error: error.message
            };
        }
    }

    // 运行所有测试
    async runAllTests(): Promise<void> {
        console.log('🌊 开始测试服务端流式传输支持...\n');
        console.log(`测试目标: ${UPLOAD_URL}\n`);

        const tests = [
            this.testStreamingHeaders(),
            this.testRangeRequests(),
            this.testLargeFileUpload(),
            this.testStreamingUpload(),
            this.testChunkedTransfer(),
            this.testChunkedStreamingUpload()
        ];

        this.results = await Promise.all(tests);

        // 打印结果
        this.printResults();

        // 生成总结
        this.generateSummary();
    }

    // 打印测试结果
    private printResults(): void {
        console.log('📊 流式传输测试结果:\n');

        this.results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.test}`);

            if (result.error) {
                console.log(`   错误: ${result.error}`);
            }

            if (result.details && Object.keys(result.details).length > 0) {
                console.log(`   详细信息:`, JSON.stringify(result.details, null, 2));
            }

            console.log('');
        });
    }

    // 生成测试总结
    private generateSummary(): void {
        console.log('📋 流式传输能力分析:\n');

        const headerTest = this.results.find(r => r.test.includes('Headers'));
        const rangeTest = this.results.find(r => r.test.includes('Range'));
        const largeFileTest = this.results.find(r => r.test.includes('Large File'));
        const streamingTest = this.results.find(r => r.test.includes('Streaming Upload'));
        const chunkedTest = this.results.find(r => r.test.includes('Chunked Transfer'));

        console.log('🔍 服务端流式传输能力:');

        if (headerTest?.success) {
            console.log('✅ 服务器响应头分析完成');
            const details = headerTest.details?.streamingSupport;
            if (details?.acceptRanges === 'bytes') {
                console.log('✅ 支持 Range 请求');
            }
            if (details?.transferEncoding) {
                console.log('✅ 支持 Transfer-Encoding');
            }
        }

        if (rangeTest?.details?.acceptRanges === 'bytes') {
            console.log('✅ 支持 HTTP Range 请求');
        } else {
            console.log('❌ 不支持 HTTP Range 请求');
        }

        if (largeFileTest?.success) {
            console.log('✅ 支持大文件上传');
            const uploadTime = largeFileTest.details?.uploadTime;
            const memoryUsed = largeFileTest.details?.memoryUsed;
            console.log(`   上传时间: ${uploadTime}`);
            console.log(`   内存使用: ${memoryUsed}`);
        } else {
            console.log('❌ 大文件上传失败');
        }

        if (streamingTest?.success) {
            console.log('✅ 支持流式上传');
        } else {
            console.log('❌ 流式上传失败');
        }

        if (chunkedTest?.success) {
            console.log('✅ 支持分块传输编码');
        } else {
            console.log('❌ 分块传输编码失败');
        }

        // 给出建议
        console.log('\n💡 流式传输优化建议:');

        const supportsStreaming = largeFileTest?.success || streamingTest?.success;
        const supportsChunking = chunkedTest?.success || rangeTest?.details?.acceptRanges === 'bytes';

        if (supportsStreaming && supportsChunking) {
            console.log('🎉 该服务完全支持流式传输，可以实现高效的大文件上传');
            console.log('   建议实现:');
            console.log('   - 客户端流式读取文件');
            console.log('   - 服务端流式接收');
            console.log('   - 实时进度显示');
            console.log('   - 断点续传功能');
        } else if (supportsStreaming) {
            console.log('⚠️  该服务部分支持流式传输，建议实现客户端流式处理');
        } else {
            console.log('❌ 该服务不支持流式传输，建议采用分片上传方案');
            console.log('   替代方案:');
            console.log('   - 客户端文件分片');
            console.log('   - 并发上传分片');
            console.log('   - 服务端重组文件');
        }
    }
}

const tester = new StreamingUploadTester();
await tester.runAllTests();