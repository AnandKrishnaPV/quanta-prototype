import requests

def main():
    API_KEY = "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"
    response = requests.post(
      url="https://openrouter.ai/api/v1/chat/completions",
      headers={
        "Authorization": f"Bearer {API_KEY}",
      },
      json={
        "model": "openai/gpt-4o-mini",
        "messages": [
          {"role": "user", "content": "Hello"}
        ]
      }
    )
    print(response.status_code)
    print(response.text)

if __name__ == "__main__":
    main()
