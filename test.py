import anthropic

client = anthropic.Anthropic(api_key="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")

message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "I hear a grinding noise when I brake. What could be wrong with my car?"}
    ]
)

print(message.content[0].text)