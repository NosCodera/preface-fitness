import { supabase } from './supabase';

/*
  Preface Fitness
  Cloud data/service layer

  UI should talk to this file instead of calling Supabase directly.
  This keeps the application portable if the backend changes later.
*/

const TABLES = {
  membershipPlans: 'membership_plans',
  members: 'members',
  payments: 'payments',
  attendance: 'attendance',
  leads: 'leads',
  trainers: 'trainers',
  ptSessions: 'pt_sessions',
  progressRecords: 'progress_records',
  workoutPlans: 'workout_plans',
  dietPlans: 'diet_plans',
  communicationLogs: 'communication_logs',
  appSettings: 'app_settings',
};

function throwIfError(error, context) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  throwIfError(error, 'Unable to read Supabase user');

  if (!user) {
    throw new Error('No authenticated Supabase user');
  }

  return user;
}

export async function getCurrentUser() {
  return getAuthenticatedUser();
}

export async function getCurrentGym() {
  const user = await getAuthenticatedUser();

  const { data: membership, error: membershipError } =
    await supabase
      .from('gym_users')
      .select('id, gym_id, role')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle();

  throwIfError(
    membershipError,
    'Unable to read gym membership'
  );

  if (!membership) {
    throw new Error(
      'Authenticated user is not assigned to a Preface Fitness gym'
    );
  }

  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', membership.gym_id)
    .single();

  throwIfError(gymError, 'Unable to read gym');

  return gym;
}

async function getGymId() {
  const gym = await getCurrentGym();
  return gym.id;
}

async function selectTable(tableName, gymId) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('gym_id', gymId);

  throwIfError(
    error,
    `Unable to load ${tableName}`
  );

  return data || [];
}

function mapMembershipPlan(row) {
  return {
    id: row.id,
    name: row.name,
    months: Number(row.months || 0),
    price: Number(row.price || 0),
    description: row.description || '',
  };
}

function mapMember(row) {
  return {
    id: row.member_code || row.id,
    cloudId: row.id,

    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',

    dob: row.dob || '',
    gender: row.gender || '',
    address: row.address || '',
    emergencyContact: row.emergency_contact || '',

    plan: row.plan_name || '',
    start: row.start_date || '',
    expiry: row.expiry_date || '',
    status: row.status || 'Active',

    visits: Number(row.visits || 0),

    due: Number(
      row.due_amount ??
      row.due ??
      0
    ),

    amount: Number(
      row.membership_amount ??
      row.amount ??
      0
    ),

    paid: Number(
      row.paid_amount ??
      row.paid ??
      0
    ),

    height: row.height || '',
    weight: row.weight || '',
    bodyFat: row.body_fat || '',

    trainer: row.trainer_name || '',

    referral: row.referral_source || '',

    notes: row.notes || '',

    photo: row.photo || '',

    dietPreference:
      row.diet_preference || '',

    attendanceNumber:
      row.attendance_number || '',

    referralPoints:
      Number(row.referral_points || 0),

    referredBy:
      row.referred_by_member_id || '',

    createdAt:
      row.created_at || '',
  };
}

function mapLead(row) {
  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',

    source: row.source || '',
    stage: row.stage || 'New',

    followUp:
      row.follow_up_date || '',

    interestedPlan:
      row.interested_plan || '',

    notes: row.notes || '',

    convertedMemberId:
      row.converted_member_code || '',

    convertedAt:
      row.converted_at || '',
  };
}

function mapPayment(row, members) {
  const member = members.find(
    (item) => item.cloudId === row.member_id
  );

  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    memberId: member?.id || '',
    member: member?.name || '',

    amount: Number(row.amount || 0),

    type:
      row.payment_type ||
      'Membership',

    mode:
      row.payment_mode || '',

    date:
      row.payment_date || '',

    notes:
      row.notes || '',
  };
}

function mapAttendance(row, members) {
  const member = members.find(
    (item) => item.cloudId === row.member_id
  );

  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    memberId: member?.id || '',
    member: member?.name || '',

    date:
      row.attendance_date || '',

    time:
      row.check_in_time || '',

    latitude:
      row.latitude ?? null,

    longitude:
      row.longitude ?? null,

    distance:
      row.distance_meters ?? null,

    source:
      row.source || 'manual',
  };
}

function mapTrainer(row) {
  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    name: row.name || '',
    phone: row.phone || '',

    specialization:
      row.specialization || '',

    experience:
      row.experience || '',

    status:
      row.status || 'Active',

    monthlySalary:
      Number(row.monthly_salary || 0),

    notes:
      row.notes || '',
  };
}

function mapPTSession(row, members, trainers) {
  const member = members.find(
    (item) => item.cloudId === row.member_id
  );

  const trainer = trainers.find(
    (item) => item.cloudId === row.trainer_id
  );

  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    memberId: member?.id || '',
    member: member?.name || '',

    trainerId: trainer?.id || '',
    trainer: trainer?.name || '',

    date:
      row.session_date || '',

    startTime:
      row.start_time || '',

    endTime:
      row.end_time || '',

    status:
      row.status || 'Scheduled',

    amount:
      Number(row.amount || 0),

    notes:
      row.notes || '',
  };
}

function mapProgressRecord(row, members) {
  const member = members.find(
    (item) => item.cloudId === row.member_id
  );

  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    memberId: member?.id || '',

    date:
      row.record_date || '',

    weight:
      row.weight ?? '',

    bodyFat:
      row.body_fat ?? '',

    chest:
      row.chest ?? '',

    waist:
      row.waist ?? '',

    hips:
      row.hips ?? '',

    arms:
      row.arms ?? '',

    thighs:
      row.thighs ?? '',

    neck:
      row.neck ?? '',

    notes:
      row.notes || '',

    photos:
      row.photos || {
        front: '',
        side: '',
        back: '',
      },
  };
}

function mapWorkoutPlan(row, members) {
  const assignedCloudIds =
    Array.isArray(row.assigned_member_ids)
      ? row.assigned_member_ids
      : [];

  const assignedMemberIds = assignedCloudIds
    .map((cloudId) => {
      const member = members.find(
        (item) => item.cloudId === cloudId
      );

      return member?.id || null;
    })
    .filter(Boolean);

  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    name: row.name || '',
    goal: row.goal || '',
    level: row.level || '',

    durationWeeks:
      Number(row.duration_weeks || 0),

    trainer:
      row.trainer_name || '',

    notes:
      row.notes || '',

    assignedMemberIds,

    exercises:
      row.exercises || [],

    createdAt:
      row.created_at || '',
  };
}

function mapDietPlan(row, members) {
  const assignedCloudIds =
    Array.isArray(row.assigned_member_ids)
      ? row.assigned_member_ids
      : [];

  const assignedMemberIds = assignedCloudIds
    .map((cloudId) => {
      const member = members.find(
        (item) => item.cloudId === cloudId
      );

      return member?.id || null;
    })
    .filter(Boolean);

  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    name: row.name || '',
    goal: row.goal || '',

    calories:
      Number(row.calories || 0),

    protein:
      Number(row.protein || 0),

    durationWeeks:
      Number(row.duration_weeks || 0),

    coach:
      row.coach || '',

    notes:
      row.notes || '',

    assignedMemberIds,

    meals:
      row.meals || [],

    createdAt:
      row.created_at || '',
  };
}

function mapCommunicationLog(row, members) {
  const member = members.find(
    (item) => item.cloudId === row.member_id
  );

  return {
    id: row.legacy_id || row.id,
    cloudId: row.id,

    memberId:
      member?.id || '',

    member:
      member?.name || '',

    channel:
      row.channel || '',

    direction:
      row.direction || '',

    subject:
      row.subject || '',

    message:
      row.message || '',

    status:
      row.status || '',

    date:
      row.sent_at || '',
  };
}

function buildSettings(rows) {
  const settings = {};

  for (const row of rows) {
    const key = row.setting_key;

    if (!key) continue;

    settings[key] = row.setting_value;
  }

  return settings;
}

/*
 * Load the complete cloud state in the same general shape
 * that the existing React application already understands.
 */
export async function loadCloudState() {
  const gymId = await getGymId();

  const [
    membershipPlanRows,
    memberRows,
    leadRows,
    paymentRows,
    attendanceRows,
    trainerRows,
    ptSessionRows,
    progressRows,
    workoutPlanRows,
    dietPlanRows,
    communicationRows,
    settingRows,
  ] = await Promise.all([
    selectTable(TABLES.membershipPlans, gymId),
    selectTable(TABLES.members, gymId),
    selectTable(TABLES.leads, gymId),
    selectTable(TABLES.payments, gymId),
    selectTable(TABLES.attendance, gymId),
    selectTable(TABLES.trainers, gymId),
    selectTable(TABLES.ptSessions, gymId),
    selectTable(TABLES.progressRecords, gymId),
    selectTable(TABLES.workoutPlans, gymId),
    selectTable(TABLES.dietPlans, gymId),
    selectTable(TABLES.communicationLogs, gymId),
    selectTable(TABLES.appSettings, gymId),
  ]);

  const members =
    memberRows.map(mapMember);

  const trainers =
    trainerRows.map(mapTrainer);

  const gym = await getCurrentGym();

  return {
    gym,

    membershipPlans:
      membershipPlanRows.map(mapMembershipPlan),

    members,

    leads:
      leadRows.map(mapLead),

    payments:
      paymentRows.map((row) =>
        mapPayment(row, members)
      ),

    attendance:
      attendanceRows.map((row) =>
        mapAttendance(row, members)
      ),

    trainers,

    ptSessions:
      ptSessionRows.map((row) =>
        mapPTSession(
          row,
          members,
          trainers
        )
      ),

    progressRecords:
      progressRows.map((row) =>
        mapProgressRecord(
          row,
          members
        )
      ),

    workoutPlans:
      workoutPlanRows.map((row) =>
        mapWorkoutPlan(
          row,
          members
        )
      ),

    dietPlans:
      dietPlanRows.map((row) =>
        mapDietPlan(
          row,
          members
        )
      ),

    communicationLogs:
      communicationRows.map((row) =>
        mapCommunicationLog(
          row,
          members
        )
      ),

    settings:
      buildSettings(settingRows),
  };
}

/*
 * Generic helpers for future CRUD functions.
 * Keeping these here means main.jsx doesn't need direct
 * Supabase-specific calls.
 */

export async function insertRecord(
  tableName,
  payload
) {
  const gymId = await getGymId();

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      ...payload,
      gym_id: gymId,
    })
    .select()
    .single();

  throwIfError(
    error,
    `Unable to insert into ${tableName}`
  );

  return data;
}

export async function updateRecord(
  tableName,
  id,
  payload
) {
  const gymId = await getGymId();

  const { data, error } = await supabase
    .from(tableName)
    .update(payload)
    .eq('id', id)
    .eq('gym_id', gymId)
    .select()
    .single();

  throwIfError(
    error,
    `Unable to update ${tableName}`
  );

  return data;
}

export async function deleteRecord(
  tableName,
  id
) {
  const gymId = await getGymId();

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id)
    .eq('gym_id', gymId);

  throwIfError(
    error,
    `Unable to delete from ${tableName}`
  );

  return true;
}

export async function publicCheckIn({ gymId, memberNumber, latitude, longitude, gymLatitude, gymLongitude }) {
  const { data, error } = await supabase.rpc('public_check_in', {
    p_gym_id: gymId,
    p_member_number: String(memberNumber || '').trim(),
    p_lat: Number(latitude),
    p_lng: Number(longitude),
    p_gym_lat: Number(gymLatitude),
    p_gym_lng: Number(gymLongitude),
  });

  throwIfError(error, 'Unable to mark attendance');

  return data || { success: false, message: 'Attendance service returned no response.' };
}
