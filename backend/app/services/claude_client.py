import anthropic
from app.config import settings


class ClaudeClient:
    """Cliente para interactuar con la API de Claude (Anthropic)."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.default_model = settings.CLAUDE_MODEL

    def summarize(self, text: str, max_tokens: int = 500) -> dict:
        """
        Genera un resumen del texto proporcionado.

        Args:
            text: Texto a resumir
            max_tokens: Maximo de tokens para la respuesta

        Returns:
            dict con summary, model, tokens_input, tokens_output
        """
        system_prompt = """Eres un asistente especializado en crear resumenes concisos y precisos.
Tu tarea es resumir el texto proporcionado de manera clara, manteniendo los puntos clave.
El resumen debe ser en el mismo idioma que el texto original.
No incluyas frases como "El texto habla de..." o "En resumen...".
Ve directo al contenido resumido."""

        message = self.client.messages.create(
            model=self.default_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Resume el siguiente texto:\n\n{text}"
                }
            ]
        )

        return {
            "summary": message.content[0].text,
            "model": message.model,
            "tokens_input": message.usage.input_tokens,
            "tokens_output": message.usage.output_tokens
        }
