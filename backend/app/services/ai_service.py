import os
import openai

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def generate_response(prompt: str):
    openai.api_key = OPENAI_API_KEY
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role":"user","content":prompt}]
    )
    return completion.choices[0].message.content