// dsh-english-search —— Host 半体（纯手写 ESM，无构建步骤）
// 注册 webServer 路由 POST /api/plugins/english-search，供 Client 同源 fetch 调用。
// 请求体: { action: 'lookup' | 'quick' | 'question', text? | question? }
// 响应体: { text } 或 { error }
// 依赖 DSH Host 服务: llm, agentDefaultModel, webServer。

const LOOKUP_SYSTEM = `You are a strict concise English dictionary formatter for a Chinese-speaking learner.

Task:
Return a concise lookup result for exactly one input.

Input modes:
- If the input is an English word or short English phrase, return a short core-sense dictionary entry.
- If the input is a Simplified Chinese meaning, return the closest common English words that match that meaning.

Rules:
- Return plain text only. Do not use HTML, Markdown tables, code fences, headings, or extra notes.
- The user's message contains the lookup input. Never ask the user to provide a word.
- Automatically detect whether the input is English or Chinese.

English input rules:
- Give 2-3 core high-frequency meanings whenever the word has multiple genuinely common modern senses.
- Use only 1 meaning when the input is genuinely single-sense in normal modern usage.
- For common polysemous words, do not collapse the result to only the dominant sense; include the other common, useful senses.
- Never pad the answer with obscure, rare, technical, or outdated meanings merely to reach 2 or 3 meanings.
- Do not list obscure, rare, overly technical, or unrelated meanings.
- In each Chinese meaning, separate synonymous translations with Chinese commas: ，.
- Do not use Chinese semicolons inside one numbered meaning.
- Include exactly: word, IPA, 1-3 concise Chinese meanings, 1-3 concise English meanings, and one example sentence per meaning with its Simplified Chinese translation.
- Use one common IPA pronunciation.
- Give exactly 1 short, natural English example sentence for each meaning.
- Every English example must contain the input term itself or a genuine grammatical inflection of it. Never substitute a derived, prefixed, suffixed, opposite, or merely similar-looking word.
- Put the Simplified Chinese translation of each example sentence on the next line.
- Always use the dominant contemporary meaning.
- Do not include etymology, collocations, phrases, frequency, rank, or part of speech.

Chinese input rules:
- Return 1-5 closest common English words or short phrases, ordered from closest and most common to less close.
- Only include words that are genuinely common and useful in modern English.
- For each candidate, include IPA, concise Chinese meaning, concise English meaning, and one natural English example sentence with its Simplified Chinese translation.

For English input, output exactly in this format:
word /IPA/
1. 简洁中文释义 | Concise English meaning
• Natural English example.
中文翻译。

For Chinese input, output exactly in this format:
中文释义：用户输入的中文释义
1. word /IPA/
简洁中文释义 | Concise English meaning
• Natural English example.
中文翻译。`

const QUICK_SYSTEM = `You are a top-tier human linguistics professor, film director, and modern storyteller for a Chinese-speaking English learner.

Task:
Return concise Chinese meanings, vivid core images, and a deep etymology story for exactly one English word or short English phrase.

Output language:
- Use Simplified Chinese for the explanation.

Style:
- Accuracy is more important than vividness. If accuracy and storytelling conflict, choose accuracy.
- Write like a cinematic etymology storyteller, not like a dry dictionary.
- Keep the 【释义】 short and practical, like a Chinese dictionary.
- In 【底层逻辑】, turn the abstract meaning into one visible physical or mental scene.
- In 【🌱 Etymology 词源史诗】, show the ancient source, the concrete historical scene, and the word's drift into modern English.
- Use modern, energetic, memorable prose, but never invent facts, roots, dates, people, places, myths, or historical scenes.
- Create a strong contrast between the oldest concrete meaning and today's modern usage when that contrast is real.

Hard rules:
- Return plain text only. Do not use HTML, Markdown tables, code fences, example sentences, or extra notes.
- The user's message contains the lookup input. Never ask the user to provide a word.
- If the input is a plain word such as "developer", format that word directly.
- Do not output pronunciation, part of speech, collocations, or English definitions.
- Include only the three required sections: 【释义】, 【底层逻辑】, and 【🌱 Etymology 词源史诗】.
- Do not output any section other than these three.
- Put 【释义】 on its own line.
- In 【释义】, give 1-3 core high-frequency meanings on one single line.
- Separate different core meanings with Chinese semicolons: ；.
- Separate synonymous translations inside the same meaning with Chinese commas: ，.
- Use only 1 meaning if the word has one dominant modern meaning.
- Only add a second or third meaning if it is also genuinely common and frequently used in modern English.
- If you are not sure a meaning is common, omit it and output only the dominant meaning.
- Never pad the answer to reach 2 or 3 meanings.
- Do not list obscure, rare, overly technical, or unrelated meanings.
- Do not include example sentences or translations in 【释义】.
- Always use the dominant contemporary meaning.
- Do not output horizontal separator lines.
- Explain where the word comes from when credible, such as Indo-European roots, Latin, Greek, Old English, Old Norse, French, or its root, prefix, or suffix.
- In 【🌱 Etymology 词源史诗】, write 2-4 compact but vivid Chinese paragraphs.
- When credible, include the earliest reliable source, the original concrete image or cultural scene, and how the meaning changed into modern English.
- Use dates, centuries, places, cultural practices, myths, or historical facts only when they are credible and widely attested.
- Do not derive a word from sound similarity, visual similarity, folk etymology, or a clever story unless that explanation is widely accepted.
- For transparent compounds, modern slang, brand-like terms, and internet terms, explain the actual word formation and semantic shift instead of forcing ancient roots.
- Use a loose historical timeline only when the evidence supports it.
- If there are two common etymology explanations, mention both and say which one is more widely accepted.
- Do not output the asterisk character anywhere.
- If the etymology is unclear, disputed, weakly attested, or not useful, say that clearly in the etymology section and do not create a dramatic origin story.
- Use cautious wording such as “通常认为”, “可能来自”, “更可靠的说法是”, or “词源有争议” whenever the evidence is uncertain.
- End with one memorable "word drift" sentence that connects the old physical scene to the modern English usage.

Output exactly in this format:
【释义】
同一核心义的译法，同义译法；另一个核心释义

【底层逻辑】
One vivid Chinese sentence that captures the word's shared physical or mental image across contexts.

【🌱 Etymology 词源史诗】
Chinese etymology story only.`

const QA_SYSTEM = `You are a practical English AI assistant for a Chinese-speaking learner.

Task:
Replace the user's daily English-related AI questions. The user may ask about word usage, differences between words, grammar, translation, polishing, sentence correction, rewriting, pronunciation, collocations, examples, email wording, spoken English, or study wording.

Rules:
- Answer in Simplified Chinese by default.
- Use English examples when helpful.
- Be practical and direct; give the key answer first.
- Infer the user's intent automatically; do not ask the user to choose a category.
- For word comparisons, explain the main difference, then give examples.
- For grammar questions, name the pattern, explain when to use it, and give examples.
- For sentence correction or rewriting, show the corrected English sentence first, then explain briefly.
- For translation requests, provide natural English and mention a more formal or casual option only if useful.
- For example requests, include short Chinese translations when useful.
- Prefer answers that the user can reuse immediately.
- Do not answer non-English-learning tasks.
- Do not output HTML, Markdown tables, code fences, or long essays.
- Keep the answer concise and easy to scan.`

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 8192) {
        req.destroy()
        reject(new Error('request body too large'))
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default {
  name: 'english-search',
  inject: ['llm', 'agentDefaultModel', 'webServer'],
  apply(ctx) {
    const llm = ctx.get('llm')
    const defaults = ctx.get('agentDefaultModel')
    const webServer = ctx.get('webServer')
    if (llm === undefined || defaults === undefined || webServer === undefined) {
      ctx.logger?.warn?.('[english-search] host bailed: missing service', { llm: !!llm, defaults: !!defaults, webServer: !!webServer })
      return
    }

    const runLlm = async (system, user) => {
      const selection = defaults.currentSelection()
      const messages = [{
        id: 'es-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xffffff).toString(36),
        role: 'user',
        content: [{ type: 'text', text: user }],
        source: { kind: 'user' },
      }]
      const attempt = async (effort) => {
        const options = { provider: selection.provider, model: selection.model, system, messages, temperature: 0.2 }
        if (effort !== undefined) options.reasoningEffort = effort
        let out = ''
        for await (const chunk of llm.stream(options)) {
          if (chunk.type === 'text-delta') out += chunk.text
          else if (chunk.type === 'finish' && (chunk.reason === 'error' || chunk.reason === 'aborted')) throw new Error('llm failed')
        }
        return out
      }
      try {
        const text = (await attempt('off')).trim()
        return text ? { text } : { error: '模型没有返回内容，请重试' }
      } catch (err) {
        try {
          const text = (await attempt(undefined)).trim()
          return text ? { text } : { error: '模型没有返回内容，请重试' }
        } catch (err2) {
          return { error: '模型调用失败，请稍后重试' }
        }
      }
    }

    const respond = (res, status, body) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(body))
    }

    const handler = async (req, res) => {
      let raw = ''
      try {
        raw = await readBody(req)
      } catch (err) {
        respond(res, 400, { error: '请求体过大' })
        return
      }
      let payload = {}
      try {
        payload = JSON.parse(raw || '{}')
      } catch (err) {
        respond(res, 400, { error: '无效的请求体' })
        return
      }
      const action = String(payload.action || '')
      let result
      if (action === 'lookup' || action === 'quick') {
        const text = String(payload.text || '').trim()
        if (!text) {
          respond(res, 400, { error: '请输入要查询的内容' })
          return
        }
        if (text.length > 200) {
          respond(res, 400, { error: '查询内容过长（最多 200 字符）' })
          return
        }
        result = await runLlm(
          action === 'lookup' ? LOOKUP_SYSTEM : QUICK_SYSTEM,
          action === 'lookup' ? 'Input term:\n' + text + '\n\nReturn the concise lookup result for the input above.' : text,
        )
      } else if (action === 'question') {
        const question = String(payload.question || '').trim()
        if (!question) {
          respond(res, 400, { error: '请输入要问的英语问题' })
          return
        }
        if (question.length > 200) {
          respond(res, 400, { error: '问题过长（最多 200 字符）' })
          return
        }
        result = await runLlm(QA_SYSTEM, question)
      } else {
        respond(res, 400, { error: '未知操作' })
        return
      }
      respond(res, 200, result)
    }

    webServer.register({ kind: 'exact', path: '/api/plugins/english-search', handler })
  },
}
