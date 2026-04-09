# Academic Content Removal Guide

This guide provides all necessary steps to remove academic/education-related content from the Benzard Sports Management System and clean up your GitHub repository.

## Summary

The codebase contains references to academic roles (Teacher, Student, Parent) that were inherited from a previous educational system. These need to be removed to complete the transition to a pure sports management platform.

## Files to Delete from GitHub

Currently, there are **NO dedicated academic files** that need to be deleted from the repository. All academic content is code _within_ existing files that needs to be refactored or removed.

## Code Sections to Remove (By File)

### 1. **Authentication & Routing**

#### File: `client/src/app/login/page.tsx`

**Lines to remove:** 61-64

```typescript
// REMOVE THESE LINES:
case 'teacher':
  return '/dashboard/teacher';
case 'student':
  return '/dashboard/student';
```

#### File: `client/src/app/dashboard/layout.tsx`

**Lines to update/remove:** 14-22

```typescript
// REPLACE THIS:
const isTeacherRoute = pathname.startsWith("/dashboard/teacher");
const isStudentRoute = pathname.startsWith("/dashboard/student");

let requiredRole: "admin" | "user" | "teacher" | "parent" | "student" = "admin";
if (isTeacherRoute) requiredRole = "teacher";
if (isStudentRoute) requiredRole = "student";

// WITH THIS:
const isAdminRoute = pathname.startsWith("/dashboard/admin");
let requiredRole: "admin" | "user" = "admin";
```

### 2. **User Management & Roles**

#### File: `client/src/app/dashboard/users/page.tsx`

**Lines to remove:** 29, 81, 113, 115, 212, 214

```typescript
// REMOVE teacher and student role definitions and options:
// Line 29: role: ROLES.TEACHER,
// Line 81: role: ROLES.TEACHER,
// Line 113: [ROLES.TEACHER]: 'bg-blue-100 text-blue-800',
// Line 115: [ROLES.STUDENT]: 'bg-yellow-100 text-yellow-800'
// Line 212: <option value={ROLES.TEACHER}>Teacher</option>
// Line 214: <option value={ROLES.STUDENT}>Student</option>
```

Keep only:

```typescript
role: ROLES.ADMIN,
role: ROLES.USER,
```

### 3. **Type Definitions**

#### File: `client/src/types/auth.ts`

- Search for and remove any `Teacher`, `Student`, or `Parent` type definitions
- Ensure only `User` and `Admin` roles remain
- Remove unused academic-related fields from user types

### 4. **Role Constants**

#### File: `client/src/lib/auth-utils.ts` or similar constants file

- Remove `ROLES.TEACHER`
- Remove `ROLES.STUDENT`
- Remove `ROLES.PARENT`
- Keep only: `ROLES.ADMIN`, `ROLES.USER`

### 5. **References in Config/Constants**

#### File: Check `middleware.ts` and any role configuration files

- Remove middleware rules for `/dashboard/teacher` routes
- Remove middleware rules for `/dashboard/student` routes
- Keep only admin and user middleware

## Step-by-Step GitHub Cleanup Process

1. **Create a new branch for this cleanup:**

   ```bash
   git checkout -b cleanup/remove-academic-content
   git pull origin main --rebase
   ```

2. **Make all code changes locally:**
   - Follow the code sections listed above
   - Remove/update all references to Teacher, Student, and Parent roles
   - Test that remaining functionality works

3. **Remove any remaining academic-related files:**
   Currently no dedicated files to remove, but check for:
   - Any dashboard/teacher folder (doesn't exist)
   - Any dashboard/student folder (doesn't exist)
   - seed files related to grades or attendance (don't exist)

4. **Commit your changes:**

   ```bash
   git add -A
   git commit -m "Remove: academic/education role references

   - Remove teacher and student role support
   - Update dashboard layout to support only admin/user roles
   - Clean up role-based routing and middleware
   - Simplify user management to sports-focused roles only"
   ```

5. **Create a Pull Request:**

   ```bash
   git push origin cleanup/remove-academic-content
   ```

   Then create PR on GitHub with title: "Remove academic content and simplify to sports management"

6. **After PR is merged, verify GitHub cleanup:**
   - Check the PR diff to ensure academic content is removed
   - All deleted lines should show in the PR history
   - No new files needed deletion (everything was updated in-place)

## Files NOT to Touch

- `client/src/app/login/helpers.tsx` - Used for all login role routing
- `client/src/components/auth/AdminProtectedRoute.tsx` - Only for admin, keep as-is
- User service files - Keep athlete/athlete-focused functionality
- Blog, events, programs, and media components - All sports-focused, no changes needed

## Verification Checklist

After making changes, verify:

- [ ] No references to `teacher` role remain in code
- [ ] No references to `student` role remain in code
- [ ] No references to `parent` role remain in code
- [ ] Lint passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Login functionality works for remaining roles (admin, user)
- [ ] Dashboard layout correctly restricts access

## Additional Notes

- The project maintains "Parent" role references in some type definitions - remove these too if they're also part of the academic system
- Consider updating PR workflows to limit roles to admin-only in CI/CD if applicable
- Check `.firebaserc` or any Firebase security rules that might reference teacher/student roles

## Questions?

If you encounter issues while implementing these changes:

1. Check the complete lint output: `pnpm lint`
2. Search the codebase for remaining: `teacher`, `student`, `parent` (case-insensitive)
3. Verify all routing guards use only `admin` or `user` roles
