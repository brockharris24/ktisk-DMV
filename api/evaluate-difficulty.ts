export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const title = (body?.title ?? '').toString().trim();

    if (!title) {
      res.status(400).json({ error: 'Missing title' });
      return;
    }

    const prompt = `Rate the DIY difficulty of "${title}" as Easy, Medium, or Hard. Return only the one word.`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 5,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      res.status(502).json({ error: 'OpenAI request failed', details: errText });
      return;
    }

    const data = await openaiRes.json();
    const raw = (data?.choices?.[0]?.message?.content ?? '').toString().trim().toLowerCase();
    const cleaned = raw.replace(/[^a-z]/g, '').trim(); // keep only letters

    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (cleaned === 'easy' || cleaned === 'medium' || cleaned === 'hard') {
      difficulty = cleaned;
    } else if (cleaned === 'e') {
      difficulty = 'easy';
    }

    res.status(200).json({ difficulty });
  } catch (err: any) {
    res.status(500).json({ error: 'Unexpected error', details: err?.message ?? String(err) });
  }
}


