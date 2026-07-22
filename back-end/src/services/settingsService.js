export const defaultPersonalSettings = {
  appearance: {
    darkTheme: true,
  },
  notifications: {
    matchAlerts: true,
    newMatch: true,
    newTryout: true,
    matchUpdated: true,
    matchReminder24h: true,
    matchReminder1h: true,
    championships: true,
    newMembers: true,
    statistics: true,
    administration: true,
  },
};

export const defaultClubSettings = {
  rules: {
    matches: true,
    calendar: true,
    registration: true,
    performanceApproval: false,
    showFutureMatches: true,
    showLogos: true,
    editAfterCreation: true,
  },
  notifications: {
    matchAlerts: true,
    newMatch: true,
    newTryout: true,
    matchUpdated: true,
    matchReminder24h: true,
    matchReminder1h: true,
    championships: true,
    newMembers: true,
    statistics: true,
    administration: true,
  },
  matches: {
    adminsCreateMatches: true,
    playersSeeFutureMatches: true,
    showOpponentLogo: true,
    showFinishedMatches: true,
    allowEditAfterCreate: true,
  },
  players: {
    adminsCreatePlayers: true,
    playersEditOwnProfile: true,
    playersEditOwnStats: true,
    requirePerformanceApproval: false,
    showShirtOnProfile: true,
    showPositionOnProfile: true,
  },
};

export const defaultRolePermissions = {
  admin: {
    createMatch: true,
    editMatch: true,
    deleteMatch: true,
    createPlayer: true,
    editPlayer: true,
    removePlayer: true,
    manageCalendar: true,
    manageClubProfile: true,
    sendNotifications: true,
    managePermissions: true,
    manageTryouts: true,
    manageChampionships: true,
    editAnyPerformance: true,
    create_match: true,
    edit_match: true,
    delete_match: true,
    create_player: true,
    edit_player: true,
    remove_player: true,
    manage_calendar: true,
    manage_club_profile: true,
    send_notifications: true,
    manage_permissions: true,
    manage_tryouts: true,
    manage_championships: true,
    edit_any_performance: true,
  },
  player: {
    viewCalendar: true,
    viewMatches: true,
    createMatch: true,
    manageTryouts: true,
    editOwnPerformance: true,
    editOwnProfile: true,
    view_calendar: true,
    view_matches: true,
    create_match: true,
    manage_tryouts: true,
    edit_own_performance: true,
    edit_own_profile: true,
  },
};

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function deepMerge(defaults, value) {
  const result = { ...defaults };

  if (!isPlainObject(value)) {
    return result;
  }

  for (const [key, nextValue] of Object.entries(value)) {
    if (isPlainObject(defaults[key])) {
      result[key] = deepMerge(defaults[key], nextValue);
    } else if (typeof defaults[key] === 'boolean') {
      result[key] = nextValue === true;
    } else {
      result[key] = nextValue;
    }
  }

  return result;
}

export function sanitizeSettings(defaults, value) {
  return deepMerge(defaults, value);
}

export async function getPersonalSettings(prisma, userId) {
  const settings = await prisma.userSetting.upsert({
    where: { userId },
    update: {},
    create: { userId, data: defaultPersonalSettings },
  });

  return sanitizeSettings(defaultPersonalSettings, settings.data);
}

export async function getClubSettings(prisma) {
  const rows = await prisma.clubSetting.findMany();
  const values = { ...defaultClubSettings };

  for (const row of rows) {
    if (values[row.key]) {
      values[row.key] = sanitizeSettings(defaultClubSettings[row.key], row.value);
    }
  }

  return values;
}

export async function getRolePermissions(prisma) {
  const rows = await prisma.rolePermission.findMany();
  const permissions = {
    admin: { ...defaultRolePermissions.admin },
    player: { ...defaultRolePermissions.player },
  };

  for (const row of rows) {
    if (!permissions[row.role]) permissions[row.role] = {};
    permissions[row.role][row.permissionKey] = row.enabled;
  }

  return permissions;
}

export async function hasPermission(prisma, role, permissionKey) {
  const existing = await prisma.rolePermission.findUnique({
    where: { role_permissionKey: { role, permissionKey } },
  });

  if (existing) return existing.enabled;

  return defaultRolePermissions[role]?.[permissionKey] === true;
}
