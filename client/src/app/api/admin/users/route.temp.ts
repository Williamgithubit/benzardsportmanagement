import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Temporary mock data for testing while Firebase is being configured
const mockUsers = [
  {
    id: 'user1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    emailVerified: true,
    photoURL: null,
  },
  {
    id: 'user2',
    email: 'teacher@example.com',
    name: 'Teacher User',
    role: 'teacher',
    status: 'active',
    lastLogin: new Date('2024-01-14'),
    createdAt: new Date('2024-01-02'),
    emailVerified: true,
    photoURL: null,
  },
  {
    id: 'user3',
    email: 'student@example.com',
    name: 'Student User',
    role: 'student',
    status: 'active',
    lastLogin: null,
    createdAt: new Date('2024-01-03'),
    emailVerified: false,
    photoURL: null,
  },
];

export async function GET() {
  try {
    console.log('Mock users API called');
    
    // Return mock data for now
    return NextResponse.json(mockUsers);
  } catch (error) {
    console.error('Error in mock users API:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: '/api/admin/users'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role = 'user' } = body;

    // Validate required fields
    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Email and password are required',
          timestamp: new Date().toISOString(),
          path: '/api/admin/users'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Mock user creation
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role,
      status: 'active',
      lastLogin: null,
      createdAt: new Date(),
      emailVerified: false,
      photoURL: null,
    };

    console.log('Mock user created:', newUser);

    return NextResponse.json({
      message: 'User created successfully (mock)',
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error in mock users POST:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: '/api/admin/users'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
