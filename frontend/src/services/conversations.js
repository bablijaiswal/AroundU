import api from './api';

export async function createOrGetConversation({
  currentUserId,
  recipientId,
  conversationType = 'join_connect',
  relatedPost = null,
  relatedModel = 'Post',
}) {
  if (!recipientId) {
    throw new Error('recipientId is required');
  }

  const payload = {
    recipientId,
    conversationType,
    relatedPost,
    relatedModel,
  };

  if (currentUserId) {
    payload.participants = [currentUserId, recipientId];
    payload.createdBy = currentUserId;
  }

  const response = await api.post('/conversations', payload);
  return response.data?.data || response.data;
}

export async function fetchConversationById(id) {
  const response = await api.get(`/conversations/${id}`);
  return response.data?.data || response.data;
}

export async function fetchConversationContext(id) {
  const response = await api.get(`/conversations/${id}/context`);
  return response.data?.data || response.data;
}