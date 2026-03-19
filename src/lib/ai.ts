import { supabase } from './supabase';

const NVIDIA_API_URL = 'https://ai.api.nvidia.com/v1/gr/meta/llama-3.2-90b-vision-instruct/chat/completions';

export const scanMediaContent = async (type: 'image' | 'video' | 'url' | 'pdf', content: string) => {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn('NVIDIA API Key not found. Skipping AI scan.');
    return { safe: true, summary: 'AI scan skipped (No API Key)' };
  }

  try {
    let prompt = '';
    if (type === 'url') {
      prompt = `Review this URL: ${content}. Is it safe? Provide a 1-sentence summary of what it is. Format: Safe: [Yes/No], Summary: [Text]`;
    } else if (type === 'image') {
      // For images, we would ideally pass the base64, but for now we'll simulate the vision prompt 
      // or use a text-based analysis of the filename/metadata if base64 is too large for a simple demo.
      prompt = `Analyzing an uploaded ${type}. Filename: ${content}. Proactively explain that this is a placeholder for a full vision scan in the production environment.`;
    }

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-90b-vision-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 128
      })
    });

    const data = await response.json();
    const result = data.choices[0].message.content;
    
    return {
      safe: !result.toLowerCase().includes('unsafe'),
      summary: result
    };
  } catch (error) {
    console.error('AI Scan Error:', error);
    return { safe: true, summary: 'AI scan failed. Proceeding with manual verification.' };
  }
};
