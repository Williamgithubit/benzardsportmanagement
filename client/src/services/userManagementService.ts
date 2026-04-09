import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  arrayUnion,
  arrayRemove,
  Timestamp,
  setDoc 
} from 'firebase/firestore';
import { db, auth } from './firebase';

// User roles constant
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent'
} as const;

// Enhanced interfaces for role-specific user management
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  level?: string;
  teacherId?: string;
  teacher?: Teacher;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  currentEnrollment: number;
  subjects: string[]; // Subject IDs
  teacherId?: string; // Primary class teacher
  students?: Student[]; // Students enrolled in this class
  description?: string; // Class description
}

export interface Teacher {
  id: string;
  email: string;
  name: string;
  phone?: string;
  employeeId: string;
  subjects: string[]; // Subject IDs assigned to teacher
  classes: string[]; // Class IDs the teacher handles
  qualifications?: string[];
  experience?: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  email: string;
  name: string;
  phone?: string;
  studentId: string;
  classId: string; // Primary class assignment
  subjects: string[]; // Subject IDs based on class
  parentIds: string[]; // Parent/Guardian IDs
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  status: 'active' | 'inactive' | 'suspended' | 'graduated';
  enrollmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Parent {
  id: string;
  email: string;
  name: string;
  phone?: string;
  studentIds: string[]; // Student IDs linked to this parent
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  occupation?: string;
  address?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeacherData {
  email: string;
  name: string;
  phone?: string;
  employeeId: string;
  subjects: string[];
  classes?: string[];
  qualifications?: string[];
  experience?: number;
  password?: string;
}

export interface CreateStudentData {
  email: string;
  name: string;
  phone?: string;
  studentId: string;
  classId: string;
  parentIds?: string[];
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  password?: string;
}

export interface CreateParentData {
  email: string;
  name: string;
  phone?: string;
  studentIds: string[];
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  occupation?: string;
  address?: string;
  password?: string;
}

class UserManagementService {
  // Collections
  private teachersCollection = collection(db, 'teachers');
  private studentsCollection = collection(db, 'students');
  private parentsCollection = collection(db, 'parents');
  private subjectsCollection = collection(db, 'subjects');
  private classesCollection = collection(db, 'classes');

  // Subject Management
  async getSubjects(): Promise<Subject[]> {
    const snapshot = await getDocs(query(this.subjectsCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Subject));
  }

  async createSubject(subjectData: Omit<Subject, 'id'>): Promise<string> {
    const docRef = await addDoc(this.subjectsCollection, subjectData);
    return docRef.id;
  }

  // Class Management
  async getClasses(): Promise<Class[]> {
    const snapshot = await getDocs(query(this.classesCollection, orderBy('grade'), orderBy('section')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Class));
  }

  async createClass(classData: Omit<Class, 'id'>): Promise<string> {
    const docRef = await addDoc(this.classesCollection, {
      ...classData,
      currentEnrollment: 0
    });
    return docRef.id;
  }

  // Teacher Management
  async getTeachers(): Promise<Teacher[]> {
    const snapshot = await getDocs(query(this.teachersCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Teacher));
  }

  async createTeacher(teacherData: CreateTeacherData): Promise<string> {
    // Validate required fields
    if (!teacherData.subjects || teacherData.subjects.length === 0) {
      throw new Error('Teacher must be assigned at least one subject');
    }

    // Check for duplicate employee ID
    const existingTeacher = await this.getTeacherByEmployeeId(teacherData.employeeId);
    if (existingTeacher) {
      throw new Error('Employee ID already exists');
    }

    // Check for duplicate email
    const existingEmail = await this.checkEmailExists(teacherData.email, 'teacher');
    if (existingEmail) {
      throw new Error('Email already exists in the system');
    }

    // Validate subjects exist
    await this.validateSubjectsExist(teacherData.subjects);

    // Validate classes exist (if provided)
    if (teacherData.classes && teacherData.classes.length > 0) {
      await this.validateClassesExist(teacherData.classes);
    }

    // Create Firebase Auth user first
    try {
      const authResponse = await fetch('/api/admin/create-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          email: teacherData.email,
          password: teacherData.password || this.generateTemporaryPassword(),
          name: teacherData.name,
          role: 'teacher'
        })
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        throw new Error(error.error || 'Failed to create authentication user');
      }

      const authUser = await authResponse.json();
      
      // Create teacher in Firestore with the auth user ID
      const now = Timestamp.now();
      const docRef = doc(this.teachersCollection, authUser.id);
      await setDoc(docRef, {
        ...teacherData,
        classes: teacherData.classes || [],
        status: 'active',
        createdAt: now,
        updatedAt: now
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  }

  async updateTeacher(teacherId: string, updateData: Partial<CreateTeacherData>): Promise<void> {
    const teacherRef = doc(this.teachersCollection, teacherId);
    
    // Validate subjects if being updated
    if (updateData.subjects) {
      if (updateData.subjects.length === 0) {
        throw new Error('Teacher must be assigned at least one subject');
      }
      await this.validateSubjectsExist(updateData.subjects);
    }

    // Validate classes if being updated
    if (updateData.classes && updateData.classes.length > 0) {
      await this.validateClassesExist(updateData.classes);
    }

    await updateDoc(teacherRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  async getTeacherByEmployeeId(employeeId: string): Promise<Teacher | null> {
    const q = query(this.teachersCollection, where('employeeId', '==', employeeId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Teacher;
  }

  // Student Management
  async getStudents(): Promise<Student[]> {
    const snapshot = await getDocs(query(this.studentsCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateOfBirth: doc.data().dateOfBirth?.toDate(),
      enrollmentDate: doc.data().enrollmentDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Student));
  }

  async createStudent(studentData: CreateStudentData): Promise<string> {
    // Check for duplicate student ID
    const existingStudent = await this.getStudentByStudentId(studentData.studentId);
    if (existingStudent) {
      throw new Error('Student ID already exists');
    }

    // Check for duplicate email
    const existingEmail = await this.checkEmailExists(studentData.email, 'student');
    if (existingEmail) {
      throw new Error('Email already exists in the system');
    }

    // Validate class exists
    const classDoc = await getDoc(doc(this.classesCollection, studentData.classId));
    if (!classDoc.exists()) {
      throw new Error('Selected class does not exist');
    }

    const classData = classDoc.data() as Class;
    
    // Check class capacity
    if (classData.currentEnrollment >= classData.capacity) {
      throw new Error('Class has reached maximum capacity');
    }

    // Validate parent IDs if provided
    if (studentData.parentIds && studentData.parentIds.length > 0) {
      await this.validateParentsExist(studentData.parentIds);
    }

    // Create Firebase Auth user first
    try {
      const authResponse = await fetch('/api/admin/create-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          email: studentData.email,
          password: studentData.password || this.generateTemporaryPassword(),
          name: studentData.name,
          role: 'student'
        })
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        throw new Error(error.error || 'Failed to create authentication user');
      }

      const authUser = await authResponse.json();

      const now = Timestamp.now();
      const batch = writeBatch(db);

      // Create student with the auth user ID
      const studentRef = doc(this.studentsCollection, authUser.id);
      batch.set(studentRef, {
        ...studentData,
        subjects: classData.subjects, // Assign subjects based on class
        parentIds: studentData.parentIds || [],
        dateOfBirth: studentData.dateOfBirth ? Timestamp.fromDate(studentData.dateOfBirth) : null,
        status: 'active',
        enrollmentDate: now,
        createdAt: now,
        updatedAt: now
      });

      // Update class enrollment count
      const classRef = doc(this.classesCollection, studentData.classId);
      batch.update(classRef, {
        currentEnrollment: classData.currentEnrollment + 1
      });

      // Update parent-student relationships if parent IDs provided
      if (studentData.parentIds && studentData.parentIds.length > 0) {
        for (const parentId of studentData.parentIds) {
          const parentRef = doc(this.parentsCollection, parentId);
          batch.update(parentRef, {
            studentIds: arrayUnion(studentRef.id),
            updatedAt: now
          });
        }
      }

      await batch.commit();
      return studentRef.id;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(studentId: string, updateData: Partial<Student>): Promise<void> {
    const studentRef = doc(this.studentsCollection, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }

    const currentStudent = studentDoc.data() as Student;
    const batch = writeBatch(db);

    // If class is being changed
    if (updateData.classId && updateData.classId !== currentStudent.classId) {
      // Validate new class exists
      const newClassDoc = await getDoc(doc(this.classesCollection, updateData.classId));
      if (!newClassDoc.exists()) {
        throw new Error('Selected class does not exist');
      }

      const newClassData = newClassDoc.data() as Class;
      
      // Check new class capacity
      if (newClassData.currentEnrollment >= newClassData.capacity) {
        throw new Error('New class has reached maximum capacity');
      }

      // Update old class enrollment count
      const oldClassRef = doc(this.classesCollection, currentStudent.classId);
      batch.update(oldClassRef, {
        currentEnrollment: (await getDoc(oldClassRef)).data()!.currentEnrollment - 1
      });

      // Update new class enrollment count
      const newClassRef = doc(this.classesCollection, updateData.classId);
      batch.update(newClassRef, {
        currentEnrollment: newClassData.currentEnrollment + 1
      });

      // Update student subjects based on new class
      updateData.subjects = newClassData.subjects;
    }

    // Update student
    batch.update(studentRef, {
      ...updateData,
      dateOfBirth: updateData.dateOfBirth ? Timestamp.fromDate(updateData.dateOfBirth) : undefined,
      updatedAt: Timestamp.now()
    });

    await batch.commit();
  }

  async getStudentByStudentId(studentId: string): Promise<Student | null> {
    const q = query(this.studentsCollection, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      dateOfBirth: doc.data().dateOfBirth?.toDate(),
      enrollmentDate: doc.data().enrollmentDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Student;
  }

  // Parent Management
  async getParents(): Promise<Parent[]> {
    const snapshot = await getDocs(query(this.parentsCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Parent));
  }

  async createParent(parentData: CreateParentData): Promise<string> {
    // Validate required fields
    if (!parentData.studentIds || parentData.studentIds.length === 0) {
      throw new Error('Parent must be assigned to at least one student');
    }

    // Check for duplicate email
    const existingEmail = await this.checkEmailExists(parentData.email, 'parent');
    if (existingEmail) {
      throw new Error('Email already exists in the system');
    }

    // Validate students exist
    await this.validateStudentsExist(parentData.studentIds);

    // Create Firebase Auth user first
    try {
      const authResponse = await fetch('/api/admin/create-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          email: parentData.email,
          password: parentData.password || this.generateTemporaryPassword(),
          name: parentData.name,
          role: 'parent'
        })
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        throw new Error(error.error || 'Failed to create authentication user');
      }

      const authUser = await authResponse.json();

      const now = Timestamp.now();
      const batch = writeBatch(db);

      // Create parent with the auth user ID
      const parentRef = doc(this.parentsCollection, authUser.id);
      batch.set(parentRef, {
        ...parentData,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });

      // Update student-parent relationships
      for (const studentId of parentData.studentIds) {
        const studentRef = doc(this.studentsCollection, studentId);
        batch.update(studentRef, {
          parentIds: arrayUnion(parentRef.id),
          updatedAt: now
        });
      }

      await batch.commit();
      return parentRef.id;
    } catch (error) {
      console.error('Error creating parent:', error);
      throw error;
    }
  }

  async updateParent(parentId: string, updateData: Partial<CreateParentData>): Promise<void> {
    const parentRef = doc(this.parentsCollection, parentId);
    
    // Validate students if being updated
    if (updateData.studentIds) {
      if (updateData.studentIds.length === 0) {
        throw new Error('Parent must be assigned to at least one student');
      }
      await this.validateStudentsExist(updateData.studentIds);
    }

    await updateDoc(parentRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  // Utility Methods
  private async checkEmailExists(email: string, excludeRole?: string): Promise<boolean> {
    const collections = [
      { collection: this.teachersCollection, role: 'teacher' },
      { collection: this.studentsCollection, role: 'student' },
      { collection: this.parentsCollection, role: 'parent' }
    ];

    for (const { collection: coll, role } of collections) {
      if (excludeRole && role === excludeRole) continue;
      
      const q = query(coll, where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return true;
    }

    return false;
  }

  private async validateSubjectsExist(subjectIds: string[]): Promise<void> {
    for (const subjectId of subjectIds) {
      const subjectDoc = await getDoc(doc(this.subjectsCollection, subjectId));
      if (!subjectDoc.exists()) {
        throw new Error(`Subject with ID ${subjectId} does not exist`);
      }
    }
  }

  private async validateClassesExist(classIds: string[]): Promise<void> {
    for (const classId of classIds) {
      const classDoc = await getDoc(doc(this.classesCollection, classId));
      if (!classDoc.exists()) {
        throw new Error(`Class with ID ${classId} does not exist`);
      }
    }
  }

  private async validateStudentsExist(studentIds: string[]): Promise<void> {
    for (const studentId of studentIds) {
      const studentDoc = await getDoc(doc(this.studentsCollection, studentId));
      if (!studentDoc.exists()) {
        throw new Error(`Student with ID ${studentId} does not exist`);
      }
    }
  }

  private async validateParentsExist(parentIds: string[]): Promise<void> {
    for (const parentId of parentIds) {
      const parentDoc = await getDoc(doc(this.parentsCollection, parentId));
      if (!parentDoc.exists()) {
        throw new Error(`Parent with ID ${parentId} does not exist`);
      }
    }
  }

  // Helper methods for auth integration
  private async getAuthToken(): Promise<string> {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    return await auth.currentUser.getIdToken();
  }

  private generateTemporaryPassword(): string {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Delete Methods
  async deleteTeacher(teacherId: string): Promise<void> {
    if (!teacherId || teacherId.trim() === '') {
      throw new Error('Teacher ID is required for deletion');
    }
    
    const teacherRef = doc(this.teachersCollection, teacherId);
    const teacherDoc = await getDoc(teacherRef);
    
    if (!teacherDoc.exists()) {
      throw new Error('Teacher not found');
    }

    const teacher = teacherDoc.data() as Teacher;
    const batch = writeBatch(db);

    // Remove teacher from classes they handle
    if (teacher.classes && teacher.classes.length > 0) {
      for (const classId of teacher.classes) {
        const classRef = doc(this.classesCollection, classId);
        batch.update(classRef, {
          teacherId: null
        });
      }
    }

    // Delete teacher
    batch.delete(teacherRef);
    await batch.commit();
  }

  async deleteStudent(studentId: string): Promise<void> {
    if (!studentId || studentId.trim() === '') {
      throw new Error('Student ID is required for deletion');
    }
    
    const studentRef = doc(this.studentsCollection, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }

    const student = studentDoc.data() as Student;
    const batch = writeBatch(db);

    // Update class enrollment count
    if (student.classId && student.classId.trim() !== '') {
      const classRef = doc(this.classesCollection, student.classId);
      const classDoc = await getDoc(classRef);
      if (classDoc.exists()) {
        batch.update(classRef, {
          currentEnrollment: Math.max(0, classDoc.data()!.currentEnrollment - 1)
        });
      }
    }

    // Remove student from parent relationships
    if (student.parentIds && student.parentIds.length > 0) {
      for (const parentId of student.parentIds) {
        if (parentId && parentId.trim() !== '') {
          const parentRef = doc(this.parentsCollection, parentId);
          batch.update(parentRef, {
            studentIds: arrayRemove(studentId),
            updatedAt: Timestamp.now()
          });
        }
      }
    }

    // Delete student
    batch.delete(studentRef);
    await batch.commit();
  }

  async deleteParent(parentId: string): Promise<void> {
    if (!parentId || parentId.trim() === '') {
      throw new Error('Parent ID is required for deletion');
    }
    
    const parentRef = doc(this.parentsCollection, parentId);
    const parentDoc = await getDoc(parentRef);
    
    if (!parentDoc.exists()) {
      throw new Error('Parent not found');
    }

    const parent = parentDoc.data() as Parent;
    const batch = writeBatch(db);

    // Remove parent from student relationships
    if (parent.studentIds && parent.studentIds.length > 0) {
      for (const studentId of parent.studentIds) {
        const studentRef = doc(this.studentsCollection, studentId);
        batch.update(studentRef, {
          parentIds: arrayRemove(parentId),
          updatedAt: Timestamp.now()
        });
      }
    }

    // Delete parent
    batch.delete(parentRef);
    await batch.commit();
  }
}

const userManagementService = new UserManagementService();

// Export as both named and default export for compatibility
export { userManagementService };
export default userManagementService;

// Export specific fetch functions for compatibility
export const fetchTeachers = () => userManagementService.getTeachers();
export const fetchStudents = () => userManagementService.getStudents();
export const fetchParents = () => userManagementService.getParents();
export const fetchSubjects = () => userManagementService.getSubjects();
export const fetchClasses = () => userManagementService.getClasses();

// Export individual functions for compatibility with existing imports
export const createUser = (userData: { employeeId?: string; studentId?: string; studentIds?: string[]; [key: string]: unknown }) => {
  // Determine user type and call appropriate method
  if (userData.employeeId) {
    return userManagementService.createTeacher(userData as unknown as CreateTeacherData);
  } else if (userData.studentId) {
    return userManagementService.createStudent(userData as unknown as CreateStudentData);
  } else if (userData.studentIds) {
    return userManagementService.createParent(userData as unknown as CreateParentData);
  }
  throw new Error('Invalid user data: cannot determine user type');
};

export const getAllUsers = async () => {
  const [teachers, students, parents] = await Promise.all([
    userManagementService.getTeachers(),
    userManagementService.getStudents(),
    userManagementService.getParents()
  ]);

  // Transform role-specific interfaces to generic User interface
  const allUsers = [
    ...teachers.map(teacher => ({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      role: ROLES.TEACHER,
      status: teacher.status
    })),
    ...students.map(student => ({
      id: student.id,
      email: student.email,
      name: student.name,
      role: ROLES.STUDENT,
      status: student.status
    })),
    ...parents.map(parent => ({
      id: parent.id,
      email: parent.email,
      name: parent.name,
      role: ROLES.PARENT,
      status: parent.status
    }))
  ];

  return allUsers;
};

export const updateUserRole = async (userId: string, role: string, userData: Record<string, unknown>) => {
  switch (role) {
    case 'teacher':
      return userManagementService.updateTeacher(userId, userData);
    case 'student':
      return userManagementService.updateStudent(userId, userData);
    case 'parent':
      return userManagementService.updateParent(userId, userData);
    default:
      throw new Error(`Invalid role: ${role}`);
  }
};

export const deleteUser = async (userId: string, role: string) => {
  switch (role) {
    case 'teacher':
      return userManagementService.deleteTeacher(userId);
    case 'student':
      return userManagementService.deleteStudent(userId);
    case 'parent':
      return userManagementService.deleteParent(userId);
    default:
      throw new Error(`Invalid role: ${role}`);
  }
};
