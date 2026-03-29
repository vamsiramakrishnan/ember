import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: "AIzaSyBh5ESeMaFyOn3epBu5Lq0KZK0baR4QcQc" });

async function testPrompt(name: string, systemInstruction: string, input: string, model = "gemini-3.1-flash-lite-preview") {
  console.log(`\n--- Testing: ${name} [${model}] ---`);
  console.log(`Input: ${input.slice(0, 80)}...`);
  const start = Date.now();
  try {
    const interaction = await client.interactions.create({
      model,
      system_instruction: systemInstruction,
      input,
      stream: false,
    });
    const outputs = interaction.outputs ?? [];
    const text = outputs
      .filter((o: { type: string }) => o.type === 'text')
      .map((o: { text?: string }) => o.text ?? '')
      .join('');
    const elapsed = Date.now() - start;
    console.log(`Time: ${elapsed}ms | Length: ${text.length} chars`);
    
    try {
      const parsed = JSON.parse(text);
      console.log(`✓ Valid JSON | type: ${parsed.type || Object.keys(parsed).join(',')}`);
      const preview = parsed.content || JSON.stringify(parsed.thinker) || JSON.stringify(parsed.items) || JSON.stringify(parsed);
      console.log(`Content: ${String(preview).slice(0, 200)}`);
      return { name, success: true, parsed, elapsed };
    } catch {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          console.log(`⚠ JSON wrapped in extra text | type: ${parsed.type || Object.keys(parsed).join(',')}`);
          return { name, success: false, parsed, elapsed, issue: 'wrapped' };
        } catch { /* fall through */ }
      }
      console.log(`✗ NOT valid JSON`);
      console.log(`Raw: ${text.slice(0, 300)}`);
      return { name, success: false, elapsed, issue: 'invalid-json' };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`ERROR: ${msg.slice(0, 200)}`);
    return { name, success: false, elapsed: Date.now() - start, issue: 'api-error' };
  }
}

const TUTOR_PROMPT = `You are the tutor — a mind: well-read, deeply curious, endlessly patient. You know what this student has been thinking about. You speak the way a brilliant, kind adult speaks to a child they respect.

Voice rules:
- Never praise without substance ("Great job!" is forbidden)
- Never use exclamation marks as enthusiasm signals
- Never use emoji, gamified encouragement, or refer to yourself by name
- Always address the student's actual reasoning, not just their answer
- Always make connections between the student's interests and the concept
- Always name the thinkers whose ideas are in play
- Never stop at confirmation — always extend with a follow-up question or deeper probe

Response format — respond with ONLY a JSON object, one of:
{"type": "tutor-marginalia", "content": "..."}
{"type": "tutor-question", "content": "..."}
{"type": "tutor-connection", "content": "...", "emphasisEnd": <number>}
{"type": "thinker-card", "thinker": {"name": "...", "dates": "...", "gift": "...", "bridge": "..."}}
{"type": "concept-diagram", "items": [{"label": "...", "subLabel": "..."}, ...]}
{"type": "tutor-directive", "content": "...", "action": "search | read | try | observe | compare"}

Keep responses concise: 1-3 sentences for marginalia/questions/directives.`;

async function main() {
  const results: Array<{ name: string; success: boolean; elapsed: number; issue?: string }> = [];

  // Test with gemini-3.1-flash-lite-preview (the model tutor actually uses)
  const tutorInputs = [
    "[prose]: I think music and math are connected somehow. Like, when you play two notes that sound good together, there's a ratio between their frequencies, right?",
    "[prose]: Wait, so if ellipses are about ratios too, does that mean Kepler was thinking about music when he studied orbits?",
    "[question]: Why do minor chords sound sad?",
  ];

  for (const input of tutorInputs) {
    results.push(await testPrompt("tutor", TUTOR_PROMPT, input, "gemini-3.1-flash-lite-preview"));
  }

  console.log("\n\n=== SUMMARY ===");
  let jsonSuccess = 0;
  for (const r of results) {
    const status = r.success ? '✓' : r.issue === 'wrapped' ? '⚠' : '✗';
    console.log(`${status} ${r.name}: ${r.elapsed}ms ${r.issue || ''}`);
    if (r.success) jsonSuccess++;
  }
  console.log(`\nJSON compliance: ${jsonSuccess}/${results.length} (${Math.round(100*jsonSuccess/results.length)}%)`);
}

main().catch(console.error);
