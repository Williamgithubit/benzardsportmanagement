export interface TeamRecord {
  id: string;
  name: string;
  slug: string;
  createdBy?: string | null;
  memberIds?: string[];
  staffIds?: string[];
  coachIds?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TeamContext {
  teamId: string;
  team: TeamRecord | null;
}
