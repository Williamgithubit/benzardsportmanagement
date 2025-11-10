import { createEvent, CreateEventData } from '@/services/eventService';

const sampleEvents: CreateEventData[] = [
  {
    title: 'Summer Basketball Tournament',
    description: 'Annual summer basketball tournament featuring teams from across the region. Open to all age groups with multiple divisions.',
    startDate: new Date('2025-08-15T09:00:00'),
    endDate: new Date('2025-08-15T17:00:00'),
    location: 'City Sports Arena',
    capacity: 200,
    status: 'upcoming',
    category: 'tournament',
    price: 50.00,
    isPublic: true,
  },
  {
    title: 'Youth Soccer Training Camp',
    description: 'Intensive soccer training camp for youth players. Professional coaches will teach fundamental skills and advanced techniques.',
    startDate: new Date('2025-08-20T09:00:00'),
    endDate: new Date('2025-08-24T16:00:00'),
    location: 'Regional Soccer Complex',
    capacity: 60,
    status: 'upcoming',
    category: 'training_camp',
    price: 299.99,
    isPublic: true,
  },
  {
    title: 'Community Sports Day',
    description: 'Free community event promoting health and fitness. Multiple sports activities, demonstrations, and family-friendly competitions.',
    startDate: new Date('2025-08-10T10:00:00'),
    endDate: new Date('2025-08-10T16:00:00'),
    location: 'Community Park',
    capacity: 500,
    status: 'upcoming',
    category: 'community_outreach',
    price: 0,
    isPublic: true,
  },
  {
    title: 'Football Team Trials',
    description: 'Open trials for the upcoming football season. All positions available. Bring your boots and be ready to showcase your skills.',
    startDate: new Date('2025-07-25T14:00:00'),
    endDate: new Date('2025-07-25T18:00:00'),
    location: 'Stadium Training Ground',
    capacity: 100,
    status: 'completed',
    category: 'trial',
    price: 25.00,
    isPublic: true,
  },
  {
    title: 'Championship Finals Match',
    description: 'The season finale championship match. Watch the top two teams compete for the trophy in an exciting showdown.',
    startDate: new Date('2025-09-05T19:00:00'),
    endDate: new Date('2025-09-05T21:00:00'),
    location: 'Main Stadium',
    capacity: 5000,
    status: 'upcoming',
    category: 'match',
    price: 35.00,
    isPublic: true,
  },
  {
    title: 'Tennis Skills Clinic',
    description: 'Improve your tennis game with expert coaching. Suitable for beginners and intermediate players looking to refine their technique.',
    startDate: new Date('2025-08-12T10:00:00'),
    endDate: new Date('2025-08-12T14:00:00'),
    location: 'Tennis Center',
    capacity: 30,
    status: 'upcoming',
    category: 'clinic',
    price: 45.00,
    isPublic: true,
  },
  {
    title: 'Swimming Gala',
    description: 'Competitive swimming event featuring various age categories and stroke competitions. Spectators welcome.',
    startDate: new Date('2025-07-30T09:00:00'),
    endDate: new Date('2025-07-30T15:00:00'),
    location: 'Aquatic Center',
    capacity: 150,
    status: 'completed',
    category: 'tournament',
    price: 20.00,
    isPublic: true,
  },
  {
    title: 'Rugby Development Camp',
    description: 'Week-long rugby training camp focusing on skills development, teamwork, and match preparation for young athletes.',
    startDate: new Date('2025-08-25T09:00:00'),
    endDate: new Date('2025-08-29T16:00:00'),
    location: 'Rugby Training Facility',
    capacity: 50,
    status: 'upcoming',
    category: 'training_camp',
    price: 350.00,
    isPublic: true,
  },
  {
    title: 'Athletics Meet',
    description: 'Track and field athletics meet with events including sprints, long distance, jumps, and throws. All ages welcome.',
    startDate: new Date('2025-08-18T08:00:00'),
    endDate: new Date('2025-08-18T17:00:00'),
    location: 'Athletics Stadium',
    capacity: 300,
    status: 'upcoming',
    category: 'tournament',
    price: 15.00,
    isPublic: true,
  },
  {
    title: 'Volleyball Beach Tournament',
    description: 'Beach volleyball tournament with doubles and mixed doubles categories. Fun, competitive atmosphere by the coast.',
    startDate: new Date('2025-08-22T10:00:00'),
    endDate: new Date('2025-08-22T18:00:00'),
    location: 'Coastal Beach Courts',
    capacity: 80,
    status: 'upcoming',
    category: 'tournament',
    price: 40.00,
    isPublic: true,
  },
];

export const seedEventData = async (): Promise<void> => {
  try {
    console.log('Starting to seed event data...');
    
    const promises = sampleEvents.map(async (eventData, index) => {
      try {
        const eventId = await createEvent(eventData);
        console.log(`Created event ${index + 1}/${sampleEvents.length}: ${eventData.title} (ID: ${eventId})`);
        return eventId;
      } catch (error) {
        console.error(`Failed to create event: ${eventData.title}`, error);
        throw error;
      }
    });

    await Promise.all(promises);
    console.log(`Successfully seeded ${sampleEvents.length} events!`);
  } catch (error) {
    console.error('Error seeding event data:', error);
    throw new Error('Failed to seed event data');
  }
};
