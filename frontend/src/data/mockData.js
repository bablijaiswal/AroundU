export const currentUser = {
  id: 'u1',
  name: 'Anjali',
  location: 'Sector 45, Gurgaon',
  avatar: 'A',
  role: 'Community member',
};

export const users = [
  { id: 'u1', name: 'Anjali', location: 'Sector 45, Gurgaon', avatar: 'A', role: 'Host' },
  { id: 'u2', name: 'Rahul', location: 'Sector 18, Gurgaon', avatar: 'R', role: 'Volunteer' },
  { id: 'u3', name: 'Neha', location: 'Saket, Delhi', avatar: 'N', role: 'Parent' },
  { id: 'u4', name: 'Karan', location: 'Dwarka, Delhi', avatar: 'K', role: 'Cyclist' },
  { id: 'u5', name: 'Vikram', location: 'Gurgaon', avatar: 'V', role: 'DIY' },
  { id: 'u6', name: 'Pooja', location: 'Gurgaon', avatar: 'P', role: 'Cook' },
  { id: 'u7', name: 'Rajat', location: 'Sector 29', avatar: 'R', role: 'Local guide' },
  { id: 'u8', name: 'Ishita', location: 'Gurgaon', avatar: 'I', role: 'Teacher' },
];

export const sections = [
  {
    key: 'events',
    title: 'Events',
    description: 'Discover what is happening nearby and share local gatherings.',
    accent: 'Sunrise',
  },
  {
    key: 'join-connect',
    title: 'Join / Connect',
    description: 'Find neighbors, community groups, and simple ways to stay involved.',
    accent: 'Gather',
  },
  {
    key: 'help-hub',
    title: 'Help Hub',
    description: 'Offer or request practical help from people in your area.',
    accent: 'Support',
  },
];

export const featuredEvents = [
  {
    id: 'e1',
    title: 'Indie Music Night',
    venue: 'Open Air Theatre, Hauz Khas, Delhi',
    neighborhood: 'Hauz Khas',
    date: '24 May 2025',
    time: '7:00 PM onwards',
    description: 'An evening filled with amazing indie artists, great vibes and live music.',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'e2',
    title: 'The Laugh Club – Standup Show',
    venue: 'Epicentre, Gurugram',
    neighborhood: 'Gurugram',
    date: '25 May',
    time: '8:00 PM',
    category: 'Comedy',
    description: 'An evening of laughs and connection in a relaxed community setting.',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'e3',
    title: 'Food Carnival 2025',
    venue: 'Leisure Valley, Gurugram',
    neighborhood: 'Gurugram',
    date: '30 May',
    time: '12:00 PM',
    category: 'Food',
    description: 'Street food, family fun, and live music for the whole neighborhood.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  },
];

export const joinPosts = [
  {
    id: 'p1',
    author: 'Rahul',
    time: '2h ago',
    title: 'Going to Arijit Singh concert on 15 Sept.',
    body: 'Looking for 2 more people to join!',
    location: 'Sector 45, Gurgaon',
    peopleNeeded: 2,
    tags: ['Music', 'Concert'],
    userId: 'u2',
  },
  {
    id: 'p2',
    author: 'Neha',
    time: '5h ago',
    title: 'We are 4 people going for a road trip to Rishikesh this weekend.',
    body: 'Looking for 3 people to join in.',
    location: 'Saket, Delhi',
    peopleNeeded: 3,
    tags: ['Travel', 'Weekend'],
    userId: 'u3',
  },
  {
    id: 'p3',
    author: 'Karan',
    time: '1d ago',
    title: 'Cycling at Aravalli Trails this Sunday morning.',
    body: 'Anyone up?',
    location: 'Gurgaon',
    peopleNeeded: 1,
    tags: ['Cycling', 'Outdoors'],
    userId: 'u4',
  },
];

export const helpRequests = [
  {
    id: 'h1',
    author: 'Anjali',
    time: '3h ago',
    title: 'I need a plumber to fix a leaking pipe in my kitchen.',
    location: 'Sector 45, Gurgaon',
    status: 'Need Help',
    details: 'Priority this weekend if possible.',
    userId: 'u1',
  },
  {
    id: 'h2',
    author: 'Vikram',
    time: '6h ago',
    title: 'Looking for a reliable AC repair service.',
    location: 'Gurgaon',
    status: 'Need Help',
    details: 'This weekend only.',
    userId: 'u5',
  },
  {
    id: 'h3',
    author: 'Pooja',
    time: '1d ago',
    title: 'I can cook homemade meals.',
    location: 'Gurgaon',
    status: 'Can Help',
    details: 'Available on weekends.',
    userId: 'u6',
  },
  {
    id: 'h4',
    author: 'Rajat',
    time: '2d ago',
    title: 'Can anyone help me with a moving box pickup?',
    location: 'Sector 29',
    status: 'Need Help',
    details: 'Need help on Saturday morning.',
    userId: 'u7',
  },
];

export const notifications = [
  { id: 'n1', type: 'event', title: 'Indie Music Night', text: 'Starts in 2 hours in Hauz Khas', time: '2m ago' },
  { id: 'n2', type: 'join', title: 'Rahul', text: 'Left a new join request near you', time: '15m ago' },
  { id: 'n3', type: 'help', title: 'Neha', text: 'Needs help with a grocery run', time: '1h ago' },
  { id: 'n4', type: 'message', title: 'New message', text: 'Pooja shared a recommended plumber', time: '2h ago' },
];

export const messages = [
  { id: 'm1', user: 'Rahul', preview: 'Are you joining the concert this weekend?', time: '2m ago', unread: 2 },
  { id: 'm2', user: 'Pooja', preview: 'I can help with a meal drop today.', time: '1h ago', unread: 0 },
  { id: 'm3', user: 'Neha', preview: 'Let’s coordinate the road trip plan.', time: '5h ago', unread: 1 },
  { id: 'm4', user: 'Karan', preview: 'I found a great cycling route near Aravalli.', time: '1d ago', unread: 0 },
];

export const bookmarks = ['Indie Music Night', 'Community garden volunteer day', 'Language exchange meetup'];

export const trustHighlights = [
  { title: 'Real people', text: 'Connect with people in your community.' },
  { title: 'Safe & trusted', text: 'Your safety and trust are our priority.' },
  { title: 'Help & support', text: 'Let’s make our community stronger together.' },
  { title: 'Local & nearby', text: 'Everything local, right around you.' },
];

export const categories = ['All', 'Music', 'Comedy', 'Food', 'Sports', 'Community', 'Outdoors'];

export const emptyStates = {
  events: 'No events are available right now. Check back soon for local updates.',
  posts: 'No community posts yet. Be the first to create one.',
  help: 'No help requests nearby right now. Start a request for your neighborhood.',
  messages: 'Your inbox is empty right now.',
  notifications: 'No new notifications yet.',
};

export const loginInfo = {
  title: 'Welcome back to AroundU',
  subtitle: 'Your community is waiting for you.',
};
