import express from "express";
import { askAI } from "../services/aiService.js";
import { getExternalEvents } from "../services/eventsService.js";

const router = express.Router();

const EVENT_INTENT_PATTERNS = [
  /\bevent(s)?\b/i,
  /\bconcert(s)?\b/i,
  /\bshow(s)?\b/i,
  /\bgig(s)?\b/i,
  /\bfestival(s)?\b/i,
  /\bmusic\b/i,
  /\bcomedy\b/i,
  /\bstand\s*up\b/i,
  /\bsports?\b/i,
  /\bwhat.*happening/i,
  /\bwhat.*going on/i,
  /\bfind.*\b(in|at|near|around)\b/i,
];

const EVENT_FILTERS = [
  { terms: ['stand up', 'stand-up', 'comedy', 'laugh'], label: 'comedy' },
  { terms: ['concert', 'concerts', 'music', 'live music', 'gig'], label: 'concerts' },
  { terms: ['festival', 'fest'], label: 'festivals' },
  { terms: ['sport', 'sports', 'run', 'cycling', 'marathon'], label: 'sports' },
  { terms: ['food', 'culinary', 'dinner', 'lunch', 'brunch', 'taste'], label: 'food' },
];

function isEventQuery(message) {
  const text = String(message || '').toLowerCase();
  return EVENT_INTENT_PATTERNS.some((pattern) => pattern.test(text));
}

function extractCityFromMessage(message) {
  const text = String(message || '');
  const cityMatch = text.match(/\b(?:in|at|near|around)\s+([a-z0-9][a-z0-9\s,'-]{1,40})/i);

  if (!cityMatch) {
    return 'Delhi';
  }

  const city = cityMatch[1]
    .split(/\b(?:for|with|show|find|about|events?|concerts?|comedy|music|sports?|help)\b/i)[0]
    .replace(/[?.!,]+$/g, '')
    .trim();

  return city || 'Delhi';
}

function getFilterTerms(message) {
  const text = String(message || '').toLowerCase();
  const matched = EVENT_FILTERS.filter((entry) => entry.terms.some((term) => text.includes(term)));
  return matched.flatMap((entry) => entry.terms);
}

function scoreEvent(event, terms) {
  if (!terms.length) {
    return 1;
  }

  const blob = [event.title, event.description, event.venue, event.address, event.city, event.neighborhood]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return terms.reduce((score, term) => score + (blob.includes(term) ? 1 : 0), 0);
}

function filterEventsForQuery(events, message) {
  const terms = getFilterTerms(message);

  if (!terms.length) {
    return events;
  }

  return events
    .map((event) => ({ event, score: scoreEvent(event, terms) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ event }) => event);
}

function formatEventLine(event) {
  const parts = [];

  if (event.date) parts.push(`Date: ${event.date}`);
  if (event.time) parts.push(`Time: ${event.time}`);
  if (event.venue) parts.push(`Venue: ${event.venue}`);
  if (event.address && event.address !== event.venue) parts.push(`Address: ${event.address}`);
  if (event.price) parts.push(`Price: ${event.price}`);

  const details = parts.length ? ` — ${parts.join(' | ')}` : '';
  const link = event.link ? `\n${event.link}` : '';

  return `• ${event.title}${details}${link}`;
}

function getAssistantFallbackReply(message) {
  const text = String(message || '').toLowerCase();

  if (text.includes('what is aroundu') || text.includes('who are you') || text.includes('tell me about aroundu')) {
    return 'AroundU is a local community platform for discovering events, connecting with people, asking for help, and managing your profile.';
  }

  return 'I can help with events, Join / Connect, Help Hub, Messages, Notifications, Bookmarks, and Profile. Ask me what you want to do in AroundU.';
}

async function buildEventResponse(message) {
  const city = extractCityFromMessage(message);
  const events = await getExternalEvents(city);
  const filteredEvents = filterEventsForQuery(events, message).slice(0, 5);

  if (!filteredEvents.length) {
    return {
      message: `No matching events were found in ${city}.`,
      events: [],
    };
  }

  const summaryPrompt = `Using only the real event data below, write one short sentence to introduce the results for the user. Do not invent anything. Keep it concise and mention ${city} when natural.
\nUser request: ${String(message).trim()}
\nEvent data: ${JSON.stringify(filteredEvents, null, 2)}`;

  let intro = `Here are ${filteredEvents.length} real event options in ${city}:`;

  try {
    const response = await askAI(summaryPrompt);
    if (response && String(response).trim()) {
      intro = String(response).trim();
    }
  } catch (error) {
    console.warn('Event summary generation failed. Using fallback copy.');
  }

  const eventLines = filteredEvents.map(formatEventLine).join('\n\n');

  return {
    message: `${intro}\n\n${eventLines}`,
    events: filteredEvents,
  };
}

router.get("/test", async (req, res) => {
  try {
    const response = await askAI("Say hello to AroundU in one sentence.");

    res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    res.status(500).json({
      success: false,
      message: "Gemini API test failed",
    });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const trimmedMessage = String(message).trim();

    if (isEventQuery(trimmedMessage)) {
      const eventResponse = await buildEventResponse(trimmedMessage);

      return res.json({
        success: true,
        message: eventResponse.message,
        events: eventResponse.events,
      });
    }

    let response;

    try {
      response = await askAI(trimmedMessage);
    } catch (error) {
      console.warn('Assistant fallback copy used because AI providers were unavailable.');
      response = getAssistantFallbackReply(trimmedMessage);
    }

    return res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("Gemini chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Gemini assistant failed to respond",
    });
  }
});

export default router;