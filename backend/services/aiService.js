import { askGemini } from './geminiService.js';
import { askHuggingFace } from './huggingfaceService.js';

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const isRetryableGeminiError = (error) => {
  const status = Number(error?.status ?? error?.code ?? 0);

  if (RETRYABLE_STATUS_CODES.has(status)) return true;

  const message = String(error?.message || '').toLowerCase();
  return message.includes('timeout') || message.includes('network') || message.includes('rate limit');
};

export const askAI = async (message) => {
  try {
    return await askGemini(message);
  } catch (error) {
    if (!isRetryableGeminiError(error)) {
      throw error;
    }

    try {
      return await askHuggingFace(message);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
};
