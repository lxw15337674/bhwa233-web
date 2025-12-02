import { NextRequest, NextResponse } from 'next/server';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/audio/transcriptions';

export async function POST(req: NextRequest) {
  // 1. 解析 multipart/form-data
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: '未收到音频文件' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '文件大小不能超过20MB' }, { status: 400 });
  }
  // 可选：校验文件类型
  if (!file.type.startsWith('audio/')) {
    return NextResponse.json({ error: '仅支持音频文件' }, { status: 400 });
  }

  // 2. 构造转发到 SiliconFlow 的 form-data
  const siliconForm = new FormData();
  siliconForm.append('file', file, 'audio.' + (file.type.split('/')[1] || 'wav'));
  siliconForm.append('model', 'TeleAI/TeleSpeechASR');

  // 3. 调用 SiliconFlow API
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '服务端未配置 API Key' }, { status: 500 });
  }
  try {
    const resp = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: siliconForm,
    });
    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: data.error || '转写失败' }, { status: 500 });
    }
    // 只返回文本部分
    return NextResponse.json({ text: data.text || '', raw: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '转写服务异常' }, { status: 500 });
  }
} 