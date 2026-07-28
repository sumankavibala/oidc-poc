import os
import sys
import time
import requests

def main():
    api_key = os.getenv('FREE_AI_API_KEY')
    if not api_key:
        print('Error: FREE_AI_API_KEY secret is missing!')
        sys.exit(1)

    try:
        with open('pr_diff.txt', 'r', encoding='utf-8') as f:
            diff_content = f.read()[:12000]
    except Exception:
        diff_content = 'No diff found.'

    system_prompt = (
        'You are an expert software engineer specializing in performance, efficiency, and resource optimization. '
        'Analyze the following Git diff. Ignore style or syntax unless it hurts performance. '
        'Focus entirely on finding algorithmic complexity bugs (Big O issues), heavy database/API loops, memory leaks, '
        'or missing caching opportunities. Provide a highly concise markdown summary with concrete suggestions.'
    )

    headers = {'Content-Type': 'application/json'}
    payload = {
        'system_instruction': {'parts': [{'text': system_prompt}]},
        'contents': [{'parts': [{'text': f'Review this diff:\n\n{diff_content}'}]}],
        'generationConfig': {'temperature': 0.2}
    }

    # Try models in order of availability
    models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite']
    response = None

    for model in models:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
        for attempt in range(3):
            print(f'Calling {model} (Attempt {attempt + 1})...')
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=30)
                if res.status_code == 200:
                    response = res
                    break
                elif res.status_code == 429:
                    print(f'429 Rate limited on {model}, retrying in {(attempt + 1) * 5}s...')
                    time.sleep((attempt + 1) * 5)
                else:
                    print(f'Error {res.status_code} from {model}: {res.text}')
                    break
            except Exception as e:
                print(f'Request exception on {model}: {e}')
                time.sleep(2)

        if response and response.status_code == 200:
            break

    if not response or response.status_code != 200:
        err_text = response.text if response else 'No response from API'
        status = response.status_code if response else 'Error'
        print(f'API Error ({status}): {err_text}')
        with open('review.md', 'w', encoding='utf-8') as out:
            out.write(f'⚠️ **AI Reviewer encountered an API error ({status}):**\n\n```\n{err_text}\n```\n\n*Note: Free tier rate limits may be temporarily exceeded. Please retry in 1-2 minutes.*')
        sys.exit(0)

    try:
        data = response.json()
        review_text = data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        review_text = f'Failed to parse API response: {e}\nRaw response:\n{response.text}'

    with open('review.md', 'w', encoding='utf-8') as out:
        out.write('### ⚡ AI Code Efficiency Report\n\n' + review_text)

if __name__ == '__main__':
    main()
