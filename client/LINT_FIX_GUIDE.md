# ESLint Error Fix Script and Guide

This document provides a systematic approach to fixing all ESLint errors in the Benzard Sports Management project.

## Current Error Summary

**Total ERROR-level issues:** ~45
**Total WARNING-level issues:** ~100+

### Error Categories

| Category                      | Count | Priority |
| ----------------------------- | ----- | -------- |
| `no-explicit-any`             | 47    | HIGH     |
| `no-unused-vars`              | 25+   | MEDIUM   |
| `react-hooks/exhaustive-deps` | 8     | MEDIUM   |
| `no-unescaped-entities`       | 3     | MEDIUM   |
| `no-empty-object-type`        | 2     | HIGH     |
| `prefer-const`                | 1     | LOW      |
| `@next/next/no-img-element`   | 15+   | LOW      |

## Automated Fix Commands

Run these commands from `/home/william-t-johnson-jr/Desktop/benzardsportmanagement/client/`:

### 1. Remove Unused Imports (Fixes many warnings)

```bash
# Use Pylance to auto-fix unused imports
npx eslint src --fix --rule "@typescript-eslint/no-unused-vars: warn"
```

### 2. Fix Specific Files Manually

#### A. Fix `src/components/ui/SplashScreen.tsx`

Already fixed: Changed `let minTimeoutId` to `const minTimeoutId`

#### B. Fix `src/components/auth/AdminProtectedRoute.tsx`

Already fixed: Escaped apostrophe in "You don't have"

#### C. Fix `src/types/globals.d.ts`

Already fixed: Replaced empty interface with proper type signature

#### D. Fix `src/store/types.ts`

Already fixed: Added interface members to DefaultRootState

### 3. Systematic Type Fixes for `any` Types

```bash
# For each file with `any` errors, replace with specific types:

# Pattern 1: Firestore data
# Replace: const data: any = d.data();
# With:    const data = d.data() as Record<string, unknown>;

# Pattern 2: Catch clauses
# Replace: ) => { const data: any =
# With:    ) => { const data = ... as Record<string, unknown>;

# Pattern 3: API responses
# Replace: const result: any =
# With:    const result: ApiResponse =
```

### 4. Files Requiring Manual Type Fixes

#### High Priority (Breaking errors):

**`src/components/admin/BlogManagement.tsx`** - Lines 250-252, 570

- Replace `(post as any).featured` with proper type guard
- Replace `(post as any).seoTitle` with proper type guard

**`src/components/admin/ContactManagement.tsx`** - Lines 93, 125, 183

- Replace `const data: any = d.data()` with `Record<string, unknown>`

**`src/components/admin/MediaLibrary.tsx`** - Line 74

- Replace `const tags: any` with `string[]`

**`src/components/admin/MediaPicker.tsx`** - Lines 81, 83

- Replace `(param: any)` with `(param: Record<string, unknown>)`

**`src/hooks/useUserRole.ts`** - Lines 37, 121

- Replace custom claims `any` types with `Record<string, unknown>`

**`src/lib/firebase-admin.ts`** - Lines 24-26, 42

- Replace initialization `any` types with specific service types

#### Service Files (Medium Priority):

**`src/services/athleteService.ts`** - Multiple locations

- Lines 45, 52, 92, 170, 270-271, 527-528, 554, 562, 637-638
- Strategy: Create SportAthleteData interface as Record<string, unknown> base

**`src/services/blogService.ts`** - Lines 71, 122, 128

- Create BlogPostData interface for Firestore responses

**`src/services/cloudinaryService.ts`** - Lines 437, 543, 573

- Create CloudinaryResponse interface for API responses

**`src/services/notificationService.ts`** - Lines 43, 74, 85, 104, 126

- Create NotificationMessage interface

**`src/services/userManagementService.ts`** - Lines 761, 808

- Type user parameters properly

#### Type Definition Files:

**`src/types/athlete.ts`** - Line 261
**`src/types/blog.ts`** - Lines 54-55, 62
**`src/types/media.ts`** - Lines 72-73
**`src/types/notification.ts`** - Lines 6, 9

### 5. React Hook Dependency Fixes

Files with missing dependencies:

**`src/app/events/page.tsx`** - Line 36

- Add `setLoading` to useEffect dependency array

**`src/components/admin/BSMMediaLibrary.tsx`** - Line 112

- Add `loadMediaAssets` to useEffect dependency array

**`src/components/admin/EventManagement/EventManagement.tsx`** - Line 99

- Add `filterEvents` to useEffect dependency array

**`src/components/admin/MediaLibrary.tsx`** - Line 108

- Add `loadMediaFiles` to useEffect dependency array

**`src/components/admin/UserManagement.tsx`** - Line 122

- Add `fetchUsers` to useEffect dependency array

**`src/components/blog/BlogReactions.tsx`** - Line 45

- Add `loadUserReaction` to useEffect dependency array

### 6. Running the Full Lint

```bash
# From workspace root:
pnpm lint

# If there are still errors, fix them incrementally
# Run specific file linting:
pnpm lint -- --fix client/src/components/ui/SplashScreen.tsx
```

## Implementation Strategy

### Phase 1: Critical Fixes (Do Now)

1. ✅ Fixed: SplashScreen.tsx - `prefer-const`
2. ✅ Fixed: AdminProtectedRoute.tsx - unescaped entity
3. ✅ Fixed: globals.d.ts - empty object type
4. ✅ Fixed: store/types.ts - empty object type
5. → Fix: MediaPicker.tsx - any types (line 81, 83)
6. → Fix: useUserRole.ts - any types (line 37, 121)

### Phase 2: High Impact Fixes

1. Remove unused imports from all route files
2. Fix Firestore data any types (appears in 6+ files)
3. Fix React hook dependencies

### Phase 3: Cleanup

1. Replace remaining any types with proper interfaces
2. Add Image components instead of img tags (15+ locations)
3. Clean up unused variables

## Complete Fix Scripts

### Script A: Fix All Unused Imports

```bash
#!/bin/bash
# Remove unused imports - finds unused variables and attempts auto-fix
cd client
npx eslint src --fix --rule "@typescript-eslint/no-unused-vars: off"
```

### Script B: Fix All no-explicit-any

```bash
#!/bin/bash
# Mass replace any with unknown in catch clauses
find client/src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/) => { const data: any = d\.data()/\&& const data = d.data() as Record<string, unknown>/g'
```

### Script C: Fix React Hook Dependencies

```bash
#!/bin/bash
# List all files with missing dependencies
grep -r "react-hooks/exhaustive-deps" client/src --include="*.ts" --include="*.tsx" -l
```

## Expected Lint Status After Fixes

Once all fixes are applied:

```
✓ 0 errors
✓ ~40 warnings (mostly image optimization)
✓ Build succeeds: pnpm build
✓ No type errors
```

## Warnings That Can Remain (Optional)

- `@next/next/no-img-element` - Can be addressed by Next.js Image migration
- `import/no-anonymous-default-export` - Design choice, can keep as-is
- Unused console eslint-disable comments - Harmless

## Verification

After all fixes:

```bash
pnpm lint           # Should pass
pnpm build          # Should succeed
pnpm type-check     # Should have no type errors
npm test            # Run tests if available
```

## Notes

- Save this guide in `client/LINT_FIX_GUIDE.md` for team reference
- Test after each batch of changes
- Commit fixes in logical groups by file or error type
- Consider adding pre-commit hooks to prevent new lint errors
