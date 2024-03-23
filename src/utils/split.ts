export const MAX_TOKENS = 16000;

export function splitTextIntoChunks(text: string, maxTokens: number) {
  const words = text.split(/\s+/);
  let currentChunk = '';
  const chunks = [];

  words.forEach((word) => {
    if ((currentChunk + word).length <= maxTokens) {
      currentChunk += `${word} `;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = `${word} `;
    }
  });

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Add continuation markers
  const continuationMarker =
    ' [Continued in next message, please do not respond, I am still giving u context.]'; // Change this marker as needed
  for (let i = 0; i < chunks.length - 1; i++) {
    chunks[i] += continuationMarker;
  }

  return chunks;
}
