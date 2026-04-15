export const normalizeTeamId = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const teamScopedPayload = <
  T extends Record<string, unknown>,
>(
  data: T,
  teamId: string,
) => ({
  ...data,
  teamId,
});

export const matchesTeamScope = (
  teamId: string | null | undefined,
  candidateTeamId: unknown,
) => {
  const normalizedCandidate = normalizeTeamId(candidateTeamId);

  if (!teamId) {
    return true;
  }

  return normalizedCandidate === teamId;
};
