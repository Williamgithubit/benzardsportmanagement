import { 
  collection, 
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

export interface SearchResult {
  id: string;
  type: 'user' | 'program' | 'event' | 'admission' | 'certificate' | 'report' | 'setting';
  title: string;
  subtitle: string;
  url: string;
  relevance: number;
  data?: unknown; // Original data for additional context
}

export interface SearchOptions {
  types?: SearchResult['type'][];
  limit?: number;
  includeInactive?: boolean;
}

/**
 * Search across all collections for matching results
 */
export const performGlobalSearch = async (
  searchQuery: string, 
  options: SearchOptions = {}
): Promise<SearchResult[]> => {
  if (!searchQuery.trim()) {
    return [];
  }

  const { types, limit = 20, includeInactive = false } = options;
  const results: SearchResult[] = [];
  const query_lower = searchQuery.toLowerCase();

  try {
    // Search Users (from users collection)
    if (!types || types.includes('user')) {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const displayName = userData.displayName || userData.name || userData.email || '';
          const email = userData.email || '';
          const role = userData.role || 'user';
          
          if (
            displayName.toLowerCase().includes(query_lower) ||
            email.toLowerCase().includes(query_lower) ||
            role.toLowerCase().includes(query_lower)
          ) {
            results.push({
              id: doc.id,
              type: 'user',
              title: displayName || email,
              subtitle: `${role} - ${email}`,
              url: `/dashboard/users/${doc.id}`,
              relevance: calculateRelevance(searchQuery, [displayName, email, role]),
              data: userData
            });
          }
        });
      } catch (error) {
        console.warn('Error searching users:', error);
      }
    }

    // Search Programs
    if (!types || types.includes('program')) {
      try {
        const programsRef = collection(db, 'programs');
        const programsSnapshot = await getDocs(programsRef);
        
        programsSnapshot.forEach((doc) => {
          const programData = doc.data();
          const name = programData.name || '';
          const description = programData.description || '';
          const status = programData.status || '';
          
          if (
            includeInactive || status === 'active' || status === 'upcoming'
          ) {
            if (
              name.toLowerCase().includes(query_lower) ||
              description.toLowerCase().includes(query_lower) ||
              status.toLowerCase().includes(query_lower)
            ) {
              results.push({
                id: doc.id,
                type: 'program',
                title: name,
                subtitle: `${status} - ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
                url: `/dashboard/programs/${doc.id}`,
                relevance: calculateRelevance(searchQuery, [name, description, status]),
                data: programData
              });
            }
          }
        });
      } catch (error) {
        console.warn('Error searching programs:', error);
      }
    }

    // Search Events
    if (!types || types.includes('event')) {
      try {
        const eventsRef = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsRef);
        
        eventsSnapshot.forEach((doc) => {
          const eventData = doc.data();
          const title = eventData.title || '';
          const description = eventData.description || '';
          const location = eventData.location || '';
          const status = eventData.status || '';
          
          if (
            includeInactive || status === 'upcoming' || status === 'ongoing'
          ) {
            if (
              title.toLowerCase().includes(query_lower) ||
              description.toLowerCase().includes(query_lower) ||
              location.toLowerCase().includes(query_lower) ||
              status.toLowerCase().includes(query_lower)
            ) {
              const startDate = eventData.startDate?.toDate?.() || new Date(eventData.startDate);
              results.push({
                id: doc.id,
                type: 'event',
                title: title,
                subtitle: `${status} - ${location} - ${startDate.toLocaleDateString()}`,
                url: `/dashboard/events/${doc.id}`,
                relevance: calculateRelevance(searchQuery, [title, description, location, status]),
                data: eventData
              });
            }
          }
        });
      } catch (error) {
        console.warn('Error searching events:', error);
      }
    }

    // Search Admissions
    if (!types || types.includes('admission')) {
      try {
        const admissionsRef = collection(db, 'admissionApplications');
        const admissionsSnapshot = await getDocs(admissionsRef);
        
        admissionsSnapshot.forEach((doc) => {
          const admissionData = doc.data();
          const firstName = admissionData.firstName || '';
          const lastName = admissionData.lastName || '';
          const email = admissionData.email || '';
          const program = admissionData.program || '';
          const status = admissionData.status || 'pending';
          
          const fullName = `${firstName} ${lastName}`.trim();
          
          if (
            fullName.toLowerCase().includes(query_lower) ||
            email.toLowerCase().includes(query_lower) ||
            program.toLowerCase().includes(query_lower) ||
            status.toLowerCase().includes(query_lower)
          ) {
            results.push({
              id: doc.id,
              type: 'admission',
              title: `${fullName} - Application`,
              subtitle: `${status} - ${program} - ${email}`,
              url: `/dashboard/admissions/${doc.id}`,
              relevance: calculateRelevance(searchQuery, [fullName, email, program, status]),
              data: admissionData
            });
          }
        });
      } catch (error) {
        console.warn('Error searching admissions:', error);
      }
    }

    // Search Certificates
    if (!types || types.includes('certificate')) {
      try {
        const certificatesRef = collection(db, 'certificates');
        const certificatesSnapshot = await getDocs(certificatesRef);
        
        certificatesSnapshot.forEach((doc) => {
          const certData = doc.data();
          const fullName = certData.fullName || '';
          const program = certData.program || '';
          const certificateNumber = certData.certificateNumber || doc.id;
          const status = certData.status || '';
          
          if (
            fullName.toLowerCase().includes(query_lower) ||
            program.toLowerCase().includes(query_lower) ||
            certificateNumber.toLowerCase().includes(query_lower) ||
            status.toLowerCase().includes(query_lower)
          ) {
            results.push({
              id: doc.id,
              type: 'certificate',
              title: `Certificate ${certificateNumber}`,
              subtitle: `${fullName} - ${program} - ${status}`,
              url: `/dashboard/certificates/${doc.id}`,
              relevance: calculateRelevance(searchQuery, [fullName, program, certificateNumber, status]),
              data: certData
            });
          }
        });
      } catch (error) {
        console.warn('Error searching certificates:', error);
      }
    }

    // Sort by relevance and apply limit
    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(0, limit);

  } catch (error) {
    console.error('Error performing global search:', error);
    return [];
  }
};

/**
 * Calculate relevance score based on how well the search query matches the fields
 */
const calculateRelevance = (query: string, fields: string[]): number => {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  fields.forEach((field) => {
    if (!field) return;
    
    const fieldLower = field.toLowerCase();
    
    // Exact match gets highest score
    if (fieldLower === queryLower) {
      score += 100;
    }
    // Starts with query gets high score
    else if (fieldLower.startsWith(queryLower)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (fieldLower.includes(queryLower)) {
      score += 50;
    }
    // Word boundary match gets lower score
    else if (new RegExp(`\\b${queryLower}`, 'i').test(field)) {
      score += 30;
    }
  });
  
  return score;
};

/**
 * Get recent searches from localStorage
 */
export const getRecentSearches = (): string[] => {
  try {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Error loading recent searches:', error);
    return [];
  }
};

/**
 * Save search query to recent searches
 */
export const saveRecentSearch = (query: string): void => {
  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter(s => s !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  } catch (error) {
    console.warn('Error saving recent search:', error);
  }
};

/**
 * Clear all recent searches
 */
export const clearRecentSearches = (): void => {
  try {
    localStorage.removeItem('recentSearches');
  } catch (error) {
    console.warn('Error clearing recent searches:', error);
  }
};
