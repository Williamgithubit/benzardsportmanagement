#!/bin/bash
cd /home/william-t-johnson-jr/Desktop/benzardsportmanagement/client/src

modified_count=0

# Check each file
if ! grep -q "NextRequest" ./app/api/debug/env/route.ts; then
  ((modified_count++))
  echo "✓ ./app/api/debug/env/route.ts (NextRequest removed)"
fi

if ! grep -q "NextRequest" ./app/api/debug/firebase/route.ts; then
  ((modified_count++))
  echo "✓ ./app/api/debug/firebase/route.ts (NextRequest removed)"
fi

if ! grep -q "NextRequest" ./app/api/media/analytics/route.ts; then
  ((modified_count++))
  echo "✓ ./app/api/media/analytics/route.ts (NextRequest removed)"
fi

if ! grep -q "NextRequest" ./app/api/test/route.ts; then
  ((modified_count++))
  echo "✓ ./app/api/test/route.ts (NextRequest removed)"
fi

if grep -q 'Record<string, unknown>' ./components/admin/MediaPicker.tsx; then
  ((modified_count++))
  echo "✓ ./components/admin/MediaPicker.tsx (param type updated)"
fi

if ! grep -q "FaBars" ./components/Header.tsx; then
  ((modified_count++))
  echo "✓ ./components/Header.tsx (FaBars import removed)"
fi

line2=$(sed -n '2p' ./components/admin/AthleteManagement.tsx)
if ! echo "$line2" | grep -q "useEffect"; then
  ((modified_count++))
  echo "✓ ./components/admin/AthleteManagement.tsx (useEffect import removed)"
fi

echo ""
echo "Total files modified: $modified_count"
