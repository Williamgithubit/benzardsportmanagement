// This file is deprecated - teacher/student/course tracking is not used in this sports management project
// Kept as empty stub to avoid breaking any legacy imports

export class TeacherDataSeeder {
  static async seedAllData(courseIds: string[], teacherId: string): Promise<void> {
    console.log('Teacher data seeding is deprecated and not used in this sports management project');
  }

  private static async createSamplePerformanceData(courseIds: string[]): Promise<void> {
    console.log('Performance data seeding is deprecated and not used in this sports management project');
  }

  static async createSampleCourses(): Promise<string[]> {
    console.log('Course creation is deprecated and not used in this sports management project');
    return [];
  }
}
