// Mock API service - in a real application, this would connect to a backend
const api = {
  // Authentication
  login: async (credentials) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (credentials.email && credentials.password) {
      return {
        success: true,
        user: {
          id: 1,
          name: 'John Doe',
          email: credentials.email,
          role: 'student'
        },
        token: 'mock-jwt-token'
      };
    }
    throw new Error('Invalid credentials');
  },

  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (userData.email && userData.password) {
      return {
        success: true,
        message: 'Registration successful'
      };
    }
    throw new Error('Registration failed');
  },

  // Programs
  getPrograms: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        title: "Digital Literacy Program",
        description: "Foundational computer skills for beginners including typing, internet usage, and basic software applications.",
        duration: "8 weeks",
        level: "Beginner",
        price: 0
      },
      {
        id: 2,
        title: "Web Development Bootcamp",
        description: "Comprehensive training in HTML, CSS, JavaScript, and modern web frameworks for aspiring developers.",
        duration: "12 weeks",
        level: "Intermediate",
        price: 0
      }
    ];
  },

  enrollInProgram: async (userId, programId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Successfully enrolled in program'
    };
  },

  // Events
  getEvents: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        title: "Free Coding Workshop",
        date: "2024-02-15",
        time: "10:00 AM - 4:00 PM",
        location: "TTI Central Office, Monrovia",
        spots: 30,
        enrolled: 12,
        description: "Hands-on introduction to programming with Python for absolute beginners."
      }
    ];
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registerForEvent: async (userId, eventId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Successfully registered for event'
    };
  },

  // Contact
  sendContactMessage: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Message sent successfully'
    };
  },

  // Blog
  getBlogPosts: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        title: "Digital Literacy Workshop in Monrovia",
        content: "Detailed content about the workshop...",
        date: "2024-01-15",
        author: "Admin"
      }
    ];
  }
};

export default api;
export default api;