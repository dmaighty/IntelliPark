export const SUPPORT_TEAM = [
  { name: 'Reza Aghayari', email: 'reza.aghayari@sjsu.edu' },
  { name: 'Sarah Liang', email: 'sarah.liang@sjsu.edu' },
  { name: 'Quan Mai', email: 'quan.mai@sjsu.edu' },
  { name: 'Ripandeep Singh', email: 'ripandeep.singh@sjsu.edu' },
];

export const SUPPORT_RECIPIENTS = SUPPORT_TEAM.map((member) => member.email).join(',');

export const SUPPORT_FAQ = [
  {
    id: 'find-car',
    question: 'How do I find where I parked?',
    answer:
      'Open the Home tab to see your car on the map, or use Find to jump to a saved garage or recent location.',
  },
  {
    id: 'save-garage',
    question: 'How do I save a garage?',
    answer:
      'On the Find tab, open a garage, tap More info, then tap the heart icon. Saved garages appear in Profile.',
  },
  {
    id: 'drive-tracking',
    question: 'How does drive tracking work?',
    answer:
      'Choose Drive with this car from a vehicle menu on Home. IntelliPark updates driving vs parked status from your phone location.',
  },
  {
    id: 'history',
    question: 'Where can I see parking history?',
    answer:
      'Open Profile and tap My History, or go to the History tab to search past sessions by car, garage, or date.',
  },
];

export function buildSupportMailtoUrl({ subject, body }) {
  const parts = [];

  if (subject?.trim()) {
    parts.push(`subject=${encodeURIComponent(subject.trim())}`);
  }

  if (body?.trim()) {
    parts.push(`body=${encodeURIComponent(body.trim())}`);
  }

  const query = parts.length ? `?${parts.join('&')}` : '';
  return `mailto:${SUPPORT_RECIPIENTS}${query}`;
}

export function getSupportTeamLabel() {
  return SUPPORT_TEAM.map((member) => `${member.name} (${member.email})`).join('\n');
}
