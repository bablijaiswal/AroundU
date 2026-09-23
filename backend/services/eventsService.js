import ExternalEventCache from '../models/ExternalEventCache.js';

const normalizeEvent = (event = {}) => {
  const dateValue = typeof event.date === 'string'
    ? event.date
    : event.date && typeof event.date === 'object'
      ? event.date.when || event.date.start_date || event.date.value || ''
      : '';

  const timeValue = event.start_time || event.time || event.formatted_time ||
    (event.date && typeof event.date === 'object' ? event.date.start_time || event.date.time || '' : '');

  const priceFromEvent = event.price || event.ticket_price || event.price_range || event.formatted_price || event.price_text || '';
  const priceMatch = (event.description || event.snippet || '').match(/(?:₹|INR|Rs\.?|rs\.?)[\s:]*\d[\d,]*(?:\.\d+)?/i);
  const priceValue = typeof priceFromEvent === 'string'
    ? priceFromEvent.trim()
    : priceFromEvent && typeof priceFromEvent === 'object'
      ? (priceFromEvent.amount ? `${priceFromEvent.currency || '₹'} ${priceFromEvent.amount}` : '')
      : '';

  const addressValue = Array.isArray(event.address)
    ? event.address.join(', ')
    : typeof event.address === 'string'
      ? event.address
      : event.location || event.venue || '';

  return {
    title: event.title || '',
    date: dateValue || 'Date TBD',
    time: timeValue || '',
    venue: event.venue || event.location || '',
    address: addressValue || '',
    price: priceValue || (priceMatch ? priceMatch[0] : ''),
    link: event.link || '',
    thumbnail: event.thumbnail || '',
    description: event.description || event.snippet || '',
  };
};

const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function normalizeCityKey(city) {
  return String(city || 'Delhi').trim().toLowerCase() || 'delhi';
}

async function fetchFreshExternalEvents(city) {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    throw new Error('SERPAPI_KEY is not loaded');
  }

  const safeCity = String(city || 'Delhi').trim() || 'Delhi';
  const queryVariants = [
    `events in ${safeCity}`,
    `${safeCity} events`,
    `upcoming events in ${safeCity}`,
    `${safeCity} event calendar`,
  ];
  const allEvents = new Map();

  for (const query of queryVariants) {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('gl', 'in');
    url.searchParams.set('api_key', apiKey);

    const response = await fetch(url);

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const events = Array.isArray(data?.events_results) ? data.events_results : [];

    for (const event of events) {
      const title = String(event.title || '').trim();
      const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ');

      if (title && !allEvents.has(normalizedTitle)) {
        allEvents.set(normalizedTitle, event);
      }
    }

    if (allEvents.size >= 20) {
      break;
    }
  }

  return [...allEvents.values()].slice(0, 20).map(normalizeEvent);
}

export const getExternalEvents = async (city = 'Delhi') => {
  const safeCity = String(city || 'Delhi').trim() || 'Delhi';
  const cacheKey = normalizeCityKey(safeCity);
  const cacheCutoff = new Date(Date.now() - CACHE_MAX_AGE_MS);

  try {
    const cachedEvents = await ExternalEventCache.findOne({
      city: cacheKey,
      fetchedAt: { $gte: cacheCutoff },
    }).lean();

    if (cachedEvents?.events?.length) {
      return cachedEvents.events;
    }
  } catch (error) {
    console.warn('External event cache lookup failed. Fetching fresh data.');
  }

  const freshEvents = await fetchFreshExternalEvents(safeCity);

  try {
    await ExternalEventCache.findOneAndUpdate(
      { city: cacheKey },
      {
        city: cacheKey,
        events: freshEvents,
        fetchedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    console.warn('External event cache save failed. Returning fresh data without cache.');
  }

  return freshEvents;
};
