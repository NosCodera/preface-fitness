import { supabase } from './supabase';

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
  feedbacks: 'feedbacks',
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

  const {
    data: membership,
    error: membershipError,
  } = await supabase
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

  const {
    data: gym,
    error: gymError,
  } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', membership.gym_id)
    .single();

  throwIfError(
    gymError,
    'Unable to read gym'
  );

  return gym;
}

async function getGymId() {
  const gym = await getCurrentGym();
  return gym.id;
}

async function selectTable(
  tableName,
  gymId
) {
  const {
    data,
    error,
  } = await supabase
    .from(tableName)
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', {
      ascending: false,
    });

  throwIfError(
    error,
    `Unable to load ${tableName}`
  );

  return data || [];
}

const memberByCloudId = (
  members,
  id
) =>
  members.find(
    (m) => m.cloudId === id
  );

const memberByUiId = (
  members,
  id
) =>
  members.find(
    (m) => m.id === id
  );

const trainerByCloudId = (
  trainers,
  id
) =>
  trainers.find(
    (t) => t.cloudId === id
  );

function mapMembershipPlan(row) {
  return {
    id: row.id,
    cloudId: row.id,

    name:
      row.name || '',

    months:
      Number(row.months || 0),

    price:
      Number(row.price || 0),

    description:
      row.description || '',
  };
}

function mapMember(row) {
  return {
    id:
      row.member_code ||
      row.id,

    cloudId:
      row.id,

    name:
      row.name || '',

    phone:
      row.phone || '',

    email:
      row.email || '',

    dob:
      row.dob ||
      row.date_of_birth ||
      '',

    birthday:
      row.dob ||
      row.date_of_birth ||
      '',

    gender:
      row.gender || '',

    address:
      row.address || '',

    emergencyContact:
      row.emergency_contact || '',

    plan:
      row.plan_name || '',

    start:
      row.start_date || '',

    expiry:
      row.expiry_date || '',

    status:
      row.status || 'Active',

    visits:
      Number(row.visits || 0),

    due:
      Number(
        row.due_amount ??
        row.due ??
        0
      ),

    amount:
      Number(
        row.membership_amount ??
        row.amount ??
        0
      ),

    paid:
      Number(
        row.paid_amount ??
        row.paid ??
        0
      ),

    height:
      row.height || '',

    weight:
      row.weight || '',

    currentWeight:
      row.weight || '',

    bodyFat:
      row.body_fat || '',

    trainer:
      row.trainer_name || '',

    referral:
      row.referral_source || '',

    notes:
      row.notes || '',

    photo:
      row.photo || '',

    dietPreference:
      row.diet_preference || '',

    attendanceNumber:
      row.attendance_number || '',

    referralPoints:
      Number(
        row.referral_points || 0
      ),

    referredBy:
      row.referred_by_member_code ||
      row.referred_by_member_id ||
      '',

    referredClients:
      Number(
        row.referred_clients || 0
      ),

    createdAt:
      row.created_at || '',
  };
}

function mapLead(row) {
  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    name:
      row.name || '',

    phone:
      row.phone || '',

    email:
      row.email || '',

    source:
      row.source || '',

    stage:
      row.stage || 'New',

    followUp:
      row.follow_up_date || '',

    interestedPlan:
      row.interested_plan || '',

    notes:
      row.notes || '',

    lastContact:
      row.last_contact || '',

    convertedMemberId:
      row.converted_member_code || '',

    convertedAt:
      row.converted_at || '',
  };
}

function mapPayment(
  row,
  members
) {
  const member =
    memberByCloudId(
      members,
      row.member_id
    );

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    memberId:
      member?.id || '',

    member:
      member?.name || '',

    amount:
      Number(row.amount || 0),

    type:
      row.payment_type ||
      'Membership',

    mode:
      row.payment_mode || '',

    date:
      row.payment_date || '',

    notes:
      row.notes || '',

    invoiceNumber:
      row.invoice_number || '',

    gstApplicable:
      Boolean(
        row.gst_applicable
      ),

    gstRate:
      Number(
        row.gst_rate || 0
      ),

    taxableAmount:
      Number(
        row.taxable_amount || 0
      ),

    cgstAmount:
      Number(
        row.cgst_amount || 0
      ),

    sgstAmount:
      Number(
        row.sgst_amount || 0
      ),

    invoiceAmount:
      Number(
        row.invoice_amount || 0
      ),

    paidAmountAtInvoice:
      Number(
        row.paid_amount_at_invoice ||
        0
      ),

    balanceAtInvoice:
      Number(
        row.balance_at_invoice ||
        0
      ),

    description:
      row.description || '',
  };
}

function mapAttendance(
  row,
  members
) {
  const member =
    memberByCloudId(
      members,
      row.member_id
    );

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    memberId:
      member?.id || '',

    member:
      member?.name || '',

    date:
      row.attendance_date || '',

    time:
      row.check_in_time || '',

    latitude:
      row.latitude ?? null,

    longitude:
      row.longitude ?? null,

    distance:
      row.distance_meters ??
      null,

    source:
      row.source || 'Manual',
  };
}

function mapTrainer(row) {
  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    name:
      row.name || '',

    phone:
      row.phone || '',

    specialization:
      row.specialization || '',

    experience:
      Number(
        row.experience || 0
      ),

    status:
      row.status || 'Active',

    monthlySalary:
      Number(
        row.monthly_salary || 0
      ),

    notes:
      row.notes || '',
  };
}

function mapPTSession(
  row,
  members,
  trainers
) {
  const member =
    memberByCloudId(
      members,
      row.member_id
    );

  const trainer =
    trainerByCloudId(
      trainers,
      row.trainer_id
    );

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    memberId:
      member?.id || '',

    member:
      member?.name || '',

    trainerId:
      trainer?.id || '',

    trainer:
      trainer?.name || '',

    date:
      row.session_date || '',

    startTime:
      row.start_time || '',

    endTime:
      row.end_time || '',

    time:
      row.start_time || '',

    duration:
      Number(
        row.duration_minutes || 0
      ),

    type:
      row.session_type ||
      'Personal Training',

    status:
      row.status ||
      'Scheduled',

    fee:
      Number(
        row.amount || 0
      ),

    amount:
      Number(
        row.amount || 0
      ),

    notes:
      row.notes || '',
  };
}

function mapProgressRecord(
  row,
  members
) {
  const member =
    memberByCloudId(
      members,
      row.member_id
    );

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    memberId:
      member?.id || '',

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

function mapWorkoutPlan(
  row,
  members
) {
  const ids =
    Array.isArray(
      row.assigned_member_ids
    )
      ? row.assigned_member_ids
      : [];

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    name:
      row.name || '',

    goal:
      row.goal || '',

    level:
      row.level || '',

    durationWeeks:
      Number(
        row.duration_weeks || 0
      ),

    trainer:
      row.trainer_name || '',

    notes:
      row.notes || '',

    assignedMemberIds:
      ids
        .map(
          (x) =>
            memberByCloudId(
              members,
              x
            )?.id
        )
        .filter(Boolean),

    exercises:
      row.exercises || [],

    createdAt:
      row.created_at || '',
  };
}

function mapDietPlan(
  row,
  members
) {
  const ids =
    Array.isArray(
      row.assigned_member_ids
    )
      ? row.assigned_member_ids
      : [];

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    name:
      row.name || '',

    goal:
      row.goal || '',

    calories:
      Number(
        row.calories || 0
      ),

    protein:
      Number(
        row.protein || 0
      ),

    durationWeeks:
      Number(
        row.duration_weeks || 0
      ),

    coach:
      row.coach || '',

    notes:
      row.notes || '',

    assignedMemberIds:
      ids
        .map(
          (x) =>
            memberByCloudId(
              members,
              x
            )?.id
        )
        .filter(Boolean),

    meals:
      row.meals || [],

    createdAt:
      row.created_at || '',
  };
}

function mapCommunicationLog(
  row,
  members
) {
  const member =
    memberByCloudId(
      members,
      row.member_id
    );

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    memberId:
      member?.id || '',

    member:
      member?.name || '',

    channel:
      row.channel || '',

    direction:
      row.direction || '',

    template:
      row.template || '',

    subject:
      row.subject || '',

    message:
      row.message || '',

    status:
      row.status || '',

    date:
      row.communication_date ||
      row.sent_at ||
      '',

    time:
      row.communication_time ||
      '',

    createdAt:
      row.created_at || '',
  };
}

function mapFeedback(
  row,
  members
) {
  const member =
    memberByCloudId(
      members,
      row.member_id
    );

  return {
    id:
      row.legacy_id ||
      row.id,

    cloudId:
      row.id,

    memberId:
      member?.id || '',

    memberName:
      row.member_name ||
      member?.name ||
      '',

    category:
      row.category ||
      'General',

    priority:
      row.priority ||
      'medium',

    feedback:
      row.feedback ||
      '',

    status:
      row.status ||
      'Open',

    date:
      row.feedback_date ||
      '',

    notes:
      row.notes ||
      '',

    createdAt:
      row.created_at ||
      '',
  };
}

function parseSetting(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value !== 'string'
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function buildSettings(rows) {
  const out = {};

  for (
    const row of rows
  ) {
    if (
      row.setting_key
    ) {
      out[row.setting_key] =
        parseSetting(
          row.setting_value
        );
    }
  }

  return out;
}

export async function loadCloudState() {
  const gym =
    await getCurrentGym();

  const gymId =
    gym.id;

  const [
    membershipPlans,
    membersRows,
    leads,
    paymentsRows,
    attendanceRows,
    trainersRows,
    ptRows,
    progressRows,
    workoutRows,
    dietRows,
    communicationRows,
    feedbackRows,
    settingsRows,
  ] = await Promise.all([
    selectTable(
      TABLES.membershipPlans,
      gymId
    ),

    selectTable(
      TABLES.members,
      gymId
    ),

    selectTable(
      TABLES.leads,
      gymId
    ),

    selectTable(
      TABLES.payments,
      gymId
    ),

    selectTable(
      TABLES.attendance,
      gymId
    ),

    selectTable(
      TABLES.trainers,
      gymId
    ),

    selectTable(
      TABLES.ptSessions,
      gymId
    ),

    selectTable(
      TABLES.progressRecords,
      gymId
    ),

    selectTable(
      TABLES.workoutPlans,
      gymId
    ),

    selectTable(
      TABLES.dietPlans,
      gymId
    ),

    selectTable(
      TABLES.communicationLogs,
      gymId
    ),

    selectTable(
      TABLES.feedbacks,
      gymId
    ),

    selectTable(
      TABLES.appSettings,
      gymId
    ),
  ]);

  const members =
    membersRows.map(
      mapMember
    );

  const trainers =
    trainersRows.map(
      mapTrainer
    );

  return {
    gym,

    membershipPlans:
      membershipPlans.map(
        mapMembershipPlan
      ),

    members,

    leads:
      leads.map(
        mapLead
      ),

    payments:
      paymentsRows.map(
        (row) =>
          mapPayment(
            row,
            members
          )
      ),

    attendance:
      attendanceRows.map(
        (row) =>
          mapAttendance(
            row,
            members
          )
      ),

    trainers,

    ptSessions:
      ptRows.map(
        (row) =>
          mapPTSession(
            row,
            members,
            trainers
          )
      ),

    progressRecords:
      progressRows.map(
        (row) =>
          mapProgressRecord(
            row,
            members
          )
      ),

    workoutPlans:
      workoutRows.map(
        (row) =>
          mapWorkoutPlan(
            row,
            members
          )
      ),

    dietPlans:
      dietRows.map(
        (row) =>
          mapDietPlan(
            row,
            members
          )
      ),

    communicationLogs:
      communicationRows.map(
        (row) =>
          mapCommunicationLog(
            row,
            members
          )
      ),

    feedbacks:
      feedbackRows.map(
        (row) =>
          mapFeedback(
            row,
            members
          )
      ),

    settings:
      buildSettings(
        settingsRows
      ),
  };
}

export async function insertRecord(
  tableName,
  payload
) {
  const gymId =
    await getGymId();

  const {
    data,
    error,
  } = await supabase
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
  const gymId =
    await getGymId();

  const {
    data,
    error,
  } = await supabase
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
  const gymId =
    await getGymId();

  const {
    error,
  } = await supabase
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

export async function saveSettings(
  settings
) {
  const gymId =
    await getGymId();

  const entries =
    Object.entries(
      settings || {}
    );

  for (
    const [key, value]
    of entries
  ) {
    const {
      data: existing,
      error: findError,
    } = await supabase
      .from(
        TABLES.appSettings
      )
      .select('id')
      .eq(
        'gym_id',
        gymId
      )
      .eq(
        'setting_key',
        key
      )
      .maybeSingle();

    throwIfError(
      findError,
      `Unable to read setting ${key}`
    );

    const row = {
      gym_id:
        gymId,

      setting_key:
        key,

      setting_value:
        JSON.stringify(value),
    };

    if (
      existing?.id
    ) {
      const {
        error,
      } = await supabase
        .from(
          TABLES.appSettings
        )
        .update({
          setting_value:
            row.setting_value,
        })
        .eq(
          'id',
          existing.id
        )
        .eq(
          'gym_id',
          gymId
        );

      throwIfError(
        error,
        `Unable to update setting ${key}`
      );
    } else {
      const {
        error,
      } = await supabase
        .from(
          TABLES.appSettings
        )
        .insert(row);

      throwIfError(
        error,
        `Unable to insert setting ${key}`
      );
    }
  }

  return settings;
}

export async function publicCheckIn({
  gymId,
  memberNumber,
  latitude,
  longitude,
  gymLatitude,
  gymLongitude,
}) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'public_check_in',
    {
      p_gym_id:
        gymId,

      p_member_number:
        String(
          memberNumber || ''
        ).trim(),

      p_lat:
        Number(latitude),

      p_lng:
        Number(longitude),

      p_gym_lat:
        Number(gymLatitude),

      p_gym_lng:
        Number(gymLongitude),
    }
  );

  throwIfError(
    error,
    'Unable to mark attendance'
  );

  return (
    data || {
      success: false,
      message:
        'Attendance service returned no response.',
    }
  );
}


/* ============================================================
   PUBLIC CUSTOMER FEEDBACK
   ============================================================ */

export async function publicSubmitFeedback({
  gymId,
  memberName,
  category,
  priority,
  feedback,
}) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'public_submit_feedback',
    {
      p_gym_id:
        gymId,

      p_member_name:
        String(
          memberName || ''
        ).trim(),

      p_category:
        String(
          category || 'General'
        ).trim(),

      p_priority:
        String(
          priority || 'medium'
        ).trim().toLowerCase(),

      p_feedback:
        String(
          feedback || ''
        ).trim(),
    }
  );

  throwIfError(
    error,
    'Unable to submit feedback'
  );

  return (
    data || {
      success: true,
    }
  );
}