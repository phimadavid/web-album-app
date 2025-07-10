// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { text, sourceLang = 'he_IL', targetLang = 'en_XX' } = requestData;

    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // mBART requires forced BOS token at the beginning
    // This tells the model which language to translate to
    const payload = {
      inputs: text,
      parameters: {
        src_lang: sourceLang,
        tgt_lang: targetLang,
      },
    };

    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/mbart-large-50-many-to-many-mmt',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      translatedText: result[0]?.translation_text || '',
      original: text,
    });
  } catch (error) {
    console.error('Error translating text:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
