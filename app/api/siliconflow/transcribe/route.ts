import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    // 检查文件大小（SiliconFlow通常限制25MB）
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过25MB' }, { status: 400 });
    }

    // 检查文件类型
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      return NextResponse.json({
        error: `不支持的文件格式。支持的格式: ${supportedFormats.join(', ')}`
      }, { status: 400 });
    }

    // 构建SiliconFlow API请求 - 按照demo的要求
    const siliconFlowFormData = new FormData();
    siliconFlowFormData.append('file', file);
    siliconFlowFormData.append('model', 'FunAudioLLM/SenseVoiceSmall');

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.error('SILICONFLOW_API_KEY not configured');
      return NextResponse.json({ error: 'API配置错误' }, { status: 500 });
    }

    const response = await axios('https://api.siliconflow.cn/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data'
      },
      data: siliconFlowFormData
    });

    console.log('SiliconFlow API response:', {
      status: response.status,
      data: response.data
    });

    if (response.status !== 200) {
      let errorMessage = '识别失败';
      const errorData = response.data;
      errorMessage = errorData.message


      console.error('SiliconFlow API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const result = response.data;
    return NextResponse.json(result);

  } catch (error) {
    console.error('语音识别API错误:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
} 