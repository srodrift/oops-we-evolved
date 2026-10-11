export function redactSecrets(message: string, secretValues: string[] = []): string {
  let redacted = message.replace(/mongodb(?:\+srv)?:\/\/[^\s'"]+/gi, "mongodb://<redacted>");
  redacted = redacted.replace(
    /(RAINDROP_(?:API|WRITE)_KEY|OPENAI_API_KEY|ELEVENLABS_API_KEY|MONGODB_URI|writeKey)[=:]\s*\S+/gi,
    "$1=<redacted>",
  );
  for (const secret of secretValues) {
    if (secret) {
      redacted = redacted.split(secret).join("<redacted>");
    }
  }
  return redacted;
}
