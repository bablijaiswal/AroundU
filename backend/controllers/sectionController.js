import { connectSeed, eventSeed, helpSeed } from '../utils/mockData.js';

export function getEvents(req, res) {
  res.json({ success: true, data: eventSeed });
}

export function getConnections(req, res) {
  res.json({ success: true, data: connectSeed });
}

export function getHelpHubItems(req, res) {
  res.json({ success: true, data: helpSeed });
}
