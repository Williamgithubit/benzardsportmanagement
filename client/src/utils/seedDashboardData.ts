import { 
  collection, 
  addDoc, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/services/firebase';

/**
 * Utility to seed sample data for dashboard testing
 * This should only be run once to populate initial data
 */

export const seedSampleData = async () => {
  try {
    console.log('Starting to seed sample data...');

    // Check if we already have data to avoid duplicates
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    const blogPostsSnapshot = await getDocs(collection(db, 'blogPosts'));

    // Seed sample programs if none exist
    if (programsSnapshot.empty) {
      console.log('Seeding sample programs...');
      const samplePrograms = [
        {
          title: 'Web Development Bootcamp',
          description: 'Learn modern web development with React and Node.js',
          status: 'active',
          startDate: Timestamp.fromDate(new Date('2024-01-15')),
          endDate: Timestamp.fromDate(new Date('2024-06-15')),
          capacity: 30,
          enrolled: 25,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Data Science Fundamentals',
          description: 'Introduction to data science and machine learning',
          status: 'active',
          startDate: Timestamp.fromDate(new Date('2024-02-01')),
          endDate: Timestamp.fromDate(new Date('2024-07-01')),
          capacity: 20,
          enrolled: 18,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Mobile App Development',
          description: 'Build mobile apps with React Native',
          status: 'planning',
          startDate: Timestamp.fromDate(new Date('2024-03-01')),
          endDate: Timestamp.fromDate(new Date('2024-08-01')),
          capacity: 25,
          enrolled: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ];

      for (const program of samplePrograms) {
        await addDoc(collection(db, 'programs'), program);
      }
      console.log('Sample programs seeded successfully');
    }

    // Seed sample events if none exist
    if (eventsSnapshot.empty) {
      console.log('Seeding sample events...');
      const sampleEvents = [
        {
          title: 'Football Tournament 2024',
          description: 'Annual grassroots football tournament for young athletes',
          startDate: Timestamp.fromDate(new Date('2024-12-15')),
          endDate: Timestamp.fromDate(new Date('2024-12-17')),
          location: 'National Stadium, Monrovia',
          status: 'upcoming',
          category: 'tournament',
          capacity: 500,
          registrations: 234,
          price: 0,
          isPublic: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Youth Training Camp',
          description: 'Intensive training camp for aspiring football players',
          startDate: Timestamp.fromDate(new Date('2024-11-20')),
          endDate: Timestamp.fromDate(new Date('2024-11-25')),
          location: 'BSM Training Facility',
          status: 'upcoming',
          category: 'training_camp',
          capacity: 50,
          registrations: 45,
          price: 25,
          isPublic: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Community Outreach Program',
          description: 'Sports development program for local communities',
          startDate: Timestamp.fromDate(new Date('2024-11-10')),
          endDate: Timestamp.fromDate(new Date('2024-11-10')),
          location: 'Various Locations',
          status: 'upcoming',
          category: 'community_outreach',
          capacity: 200,
          registrations: 150,
          price: 0,
          isPublic: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ];

      for (const event of sampleEvents) {
        await addDoc(collection(db, 'events'), event);
      }
      console.log('Sample events seeded successfully');
    }

    // Seed sample tasks if none exist
    if (tasksSnapshot.empty) {
      console.log('Seeding sample tasks...');
      const sampleTasks = [
        {
          title: 'Update course curriculum',
          description: 'Review and update web development curriculum',
          status: 'completed',
          priority: 'high',
          assignedTo: 'admin',
          dueDate: Timestamp.fromDate(new Date('2024-07-15')),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Prepare marketing materials',
          description: 'Create brochures for upcoming programs',
          status: 'completed',
          priority: 'medium',
          assignedTo: 'marketing',
          dueDate: Timestamp.fromDate(new Date('2024-07-20')),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Schedule instructor interviews',
          description: 'Interview candidates for new instructor positions',
          status: 'in_progress',
          priority: 'high',
          assignedTo: 'hr',
          dueDate: Timestamp.fromDate(new Date('2024-08-01')),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Setup new classroom equipment',
          description: 'Install computers and projectors in new classroom',
          status: 'pending',
          priority: 'medium',
          assignedTo: 'facilities',
          dueDate: Timestamp.fromDate(new Date('2024-08-15')),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          title: 'Review student applications',
          description: 'Process applications for fall semester',
          status: 'completed',
          priority: 'high',
          assignedTo: 'admissions',
          dueDate: Timestamp.fromDate(new Date('2024-07-30')),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ];

      for (const task of sampleTasks) {
        await addDoc(collection(db, 'tasks'), task);
      }
      console.log('Sample tasks seeded successfully');
    }

    // Seed sample blog posts if none exist
    if (blogPostsSnapshot.empty) {
      console.log('Seeding sample blog posts...');
      const sampleBlogPosts = [
        {
          title: 'Upcoming Pre Season Game',
          slug: 'upcoming-pre-season-game',
          excerpt: 'Get ready for an exciting pre-season match featuring our top athletes',
          content: 'We are thrilled to announce our upcoming pre-season game...',
          author: 'Admin User',
          authorId: 'admin',
          category: 'Game',
          tags: ['football', 'tournament', 'grassroots'],
          status: 'published',
          views: 0,
          likes: 0,
          commentsCount: 0,
          publishedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ];

      for (const post of sampleBlogPosts) {
        await addDoc(collection(db, 'blogPosts'), post);
      }
      console.log('Sample blog posts seeded successfully');
    }

    console.log('Sample data seeding completed!');
    console.log(`Users: ${usersSnapshot.size} (existing)`);
    console.log(`Programs: ${programsSnapshot.size > 0 ? programsSnapshot.size : 3} (${programsSnapshot.empty ? 'seeded' : 'existing'})`);
    console.log(`Events: ${eventsSnapshot.size > 0 ? eventsSnapshot.size : 3} (${eventsSnapshot.empty ? 'seeded' : 'existing'})`);
    console.log(`Tasks: ${tasksSnapshot.size > 0 ? tasksSnapshot.size : 5} (${tasksSnapshot.empty ? 'seeded' : 'existing'})`);
    console.log(`Blog Posts: ${blogPostsSnapshot.size > 0 ? blogPostsSnapshot.size : 1} (${blogPostsSnapshot.empty ? 'seeded' : 'existing'})`);

  } catch (error) {
    console.error('Error seeding sample data:', error);
    throw error;
  }
};

// Helper function to clear all sample data (use with caution!)
export const clearSampleData = async () => {
  console.warn('This will clear ALL data from collections. Use with extreme caution!');
  // Implementation would go here if needed for testing
};
