"""OpenAI API client wrapper."""

import json
from typing import Any, Optional

from openai import OpenAI

from chefwise.config import settings


class OpenAIClient:
    """Wrapper for OpenAI API interactions."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the OpenAI client."""
        self.api_key = api_key or settings.openai_api_key
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY in .env file.")
        self.client = OpenAI(api_key=self.api_key)
        self.default_model = settings.openai_model
        self.complex_model = settings.openai_model_complex

    def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        json_mode: bool = True,
    ) -> dict[str, Any]:
        """
        Send a chat completion request and return the parsed response.

        Args:
            system_prompt: The system message setting context
            user_prompt: The user's message/request
            model: Model to use (defaults to gpt-4o-mini)
            temperature: Creativity level (0-1)
            max_tokens: Maximum response length
            json_mode: Whether to request JSON response format

        Returns:
            Parsed JSON response as a dictionary
        """
        model = model or self.default_model

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = self.client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content

        if json_mode:
            return json.loads(content)
        return {"content": content}

    def chat_completion_complex(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> dict[str, Any]:
        """Use the more capable model for complex tasks."""
        return self.chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=self.complex_model,
            **kwargs,
        )
