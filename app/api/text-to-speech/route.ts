import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceModel, speed } = await request.json();

    // 验证输入
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: '文本内容不能为空' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: '文本长度不能超过5000字符' },
        { status: 400 }
      );
    }

    // 准备SiliconFlow API请求
    const siliconFlowRequest = {
      model: 'FunAudioLLM/CosyVoice2-0.5B',
      input: text,
      voice: voiceModel || 'FunAudioLLM/CosyVoice2-0.5B: alex',
      response_format: "mp3",
      speed: speed || 1.0,
    };

    // 调用SiliconFlow API
    const response = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(siliconFlowRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `SiliconFlow API错误: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // 获取音频数据
    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // 返回音频数据
    return new NextResponse(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"'
      }
    });

  } catch (error) {
    console.error('SiliconFlow TTS API错误:', error);
    let errorMessage = '服务器内部错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求，支持CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}