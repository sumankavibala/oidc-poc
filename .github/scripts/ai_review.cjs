const fs = require('fs');

async function main() {
    const apiKey = process.env.FREE_AI_API_KEY;
    if (!apiKey) {
        console.error('Error: FREE_AI_API_KEY secret is missing!');
        process.exit(1);
    }

    let diffContent = 'No diff found.';
    try {
        if (fs.existsSync('pr_diff.txt')) {
            diffContent = fs.readFileSync('pr_diff.txt', 'utf8').slice(0, 12000);
        }
    } catch (err) {
        console.error('Error reading pr_diff.txt:', err);
    }

    const systemPrompt = 
        'You are an expert software engineer specializing in performance, efficiency, and resource optimization. ' +
        'Analyze the following Git diff. Ignore style or syntax unless it hurts performance. ' +
        'Focus entirely on finding algorithmic complexity bugs (Big O issues), heavy database/API loops, memory leaks, ' +
        'or missing caching opportunities. Provide a highly concise markdown summary with concrete suggestions.';

    const payload = {
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [
            { parts: [{ text: `Review this diff:\n\n${diffContent}` }] }
        ],
        generationConfig: {
            temperature: 0.2
        }
    };

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
    let response = null;

    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`Calling ${model} (Attempt ${attempt})...`);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) { // status 200-299
                    response = await res.json();
                    break;
                } else if (res.status === 429) {
                    console.log(`429 Rate limited on ${model}, retrying in ${attempt * 5}s...`);
                    await new Promise(r => setTimeout(r, attempt * 5000));
                } else {
                    const errText = await res.text();
                    console.log(`Error ${res.status} from ${model}: ${errText}`);
                    break;
                }
            } catch (err) {
                console.error(`Request exception on ${model}:`, err.message);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        if (response && response.candidates && response.candidates[0]) {
            break;
        }
    }

    if (!response || !response.candidates || !response.candidates[0]) {
        console.error('API Error: Unable to fetch response from Gemini API');
        const reportContent = 
            '⚠️ **AI Reviewer encountered an API error (Rate limit / Quota exceeded):**\n\n' +
            '*Note: Free tier rate limits may be temporarily exceeded. Please wait 1-2 minutes for rate limits to reset.*';
        fs.writeFileSync('review.md', reportContent, 'utf8');
        process.exit(0);
    }

    try {
        const reviewText = response.candidates[0].content.parts[0].text;
        fs.writeFileSync('review.md', '### ⚡ AI Code Efficiency Report\n\n' + reviewText, 'utf8');
    } catch (err) {
        console.error('Failed to parse API response:', err);
        fs.writeFileSync('review.md', '⚠️ **Failed to parse AI Review response.**', 'utf8');
    }
}

main().catch(err => {
    console.error('Unhandled error in script:', err);
    process.exit(1);
});
