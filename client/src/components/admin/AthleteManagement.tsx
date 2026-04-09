'use client'
import React, { useState } from 'react';
import AthleteDirectory from '@/components/athletes/AthleteDirectory';
import useUserRole from '@/hooks/useUserRole';

interface AthleteManagementProps {
  openDialog?: boolean;
  onCloseDialog?: () => void;
}

export default function AthleteManagement({ openDialog = false, onCloseDialog }: AthleteManagementProps) {
  const userRole = useUserRole();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);

  // Use internal state if no external props provided
  const dialogOpen = openDialog || internalDialogOpen;
  const handleCloseDialog = onCloseDialog || (() => setInternalDialogOpen(false));


  return (
    <AthleteDirectory
      userRole={userRole}
      openDialog={dialogOpen}
      onCloseDialog={handleCloseDialog}
    />
  );
}
