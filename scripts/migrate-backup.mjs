import dotenv from 'dotenv';

dotenv.config({
  path: '.env.migration',
});import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

const BACKUP_FILE =
  process.argv[2] ||
  path.join(PROJECT_ROOT, 'preface-fitness-backup-2026-09-23.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is missing from .env.migration');
}

if (!SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is missing from .env.migration'
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function log(message) {
  console.log(`[Preface Migration] ${message}`);
}

function warn(message) {
  console.warn(`[Preface Migration] WARNING: ${message}`);
}

function cleanString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function dateOrNull(value) {
  if (!value) return null;

  const text = String(value).trim();

  if (!text) return null;

  return text;
}

function jsonOrEmpty(value, fallback = []) {
  return value === undefined || value === null ? fallback : value;
}

async function readBackup() {
  log(`Reading backup: ${BACKUP_FILE}`);

  const raw = await fs.readFile(BACKUP_FILE, 'utf8');

  const backup = JSON.parse(raw);

  if (!backup || typeof backup !== 'object') {
    throw new Error('Backup file is not a valid JSON object.');
  }

  return backup;
}

async function getGym() {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('name', 'Preface Fitness')
    .limit(1);

  if (error) {
    throw new Error(`Unable to read gyms: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error(
      'Preface Fitness gym was not found in Supabase. Run the original schema first.'
    );
  }

  return data[0];
}

async function migrateMembershipPlans(backup, gym) {
  const plans =
    backup.membershipPlans ||
    backup.settings?.membershipPlans ||
    [];

  let count = 0;

  for (const plan of plans) {
    const payload = {
      gym_id: gym.id,
      name: cleanString(plan.name),
      months: numberOrNull(plan.months),
      price: numberOrNull(plan.price) ?? 0,
      description: cleanString(plan.description),
    };

    if (!payload.name) continue;

    const { error } = await supabase
      .from('membership_plans')
      .upsert(payload, {
        onConflict: 'gym_id,name',
      });

    if (error) {
      throw new Error(
        `Membership plan "${payload.name}" failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Membership plans migrated: ${count}`);
}

async function migrateMembers(backup, gym) {
  const members = backup.members || [];

  const memberMap = new Map();

  let count = 0;

  for (const member of members) {
    const legacyId = cleanString(member.id);

    if (!legacyId) {
      warn(`Skipping member without ID: ${member.name || 'Unknown'}`);
      continue;
    }

    const payload = {
      gym_id: gym.id,

      member_code: legacyId,

      name: cleanString(member.name),

      phone: cleanString(member.phone),

      email: cleanString(member.email),

      dob: dateOrNull(member.dob),

      gender: cleanString(member.gender),

      address: cleanString(member.address),

      emergency_contact: cleanString(member.emergencyContact),

      plan_name: cleanString(member.plan),

      start_date: dateOrNull(member.start),

      expiry_date: dateOrNull(member.expiry),

      status: cleanString(member.status) || 'Active',

      visits: numberOrNull(member.visits) ?? 0,

      due_amount: numberOrNull(member.due) ?? 0,

      membership_amount: numberOrNull(member.amount) ?? 0,

      paid_amount: numberOrNull(member.paid) ?? 0,

      height: cleanString(member.height),

      weight: cleanString(member.weight),

      body_fat: cleanString(member.bodyFat),

      trainer_name: cleanString(member.trainer),

      referral_source: cleanString(member.referral),

      notes: cleanString(member.notes),

      photo: cleanString(member.photo),

      diet_preference: cleanString(member.dietPreference),

      attendance_number: cleanString(member.attendanceNumber),

      created_at: member.createdAt || undefined,
    };

    /*
     * Some versions of the schema may not have every optional
     * field above. We remove undefined fields before sending.
     */
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    /*
     * First try the rich payload.
     *
     * If the installed schema does not contain an optional newer
     * field, we retry using the portable core member fields.
     */
    let result = await supabase
      .from('members')
      .upsert(payload, {
        onConflict: 'gym_id,member_code',
      })
      .select('id, member_code')
      .single();

    if (result.error) {
      const corePayload = {
        gym_id: gym.id,
        member_code: legacyId,
        name: cleanString(member.name),
        phone: cleanString(member.phone),
        email: cleanString(member.email),
        dob: dateOrNull(member.dob),
        gender: cleanString(member.gender),
        address: cleanString(member.address),
        emergency_contact: cleanString(member.emergencyContact),
        plan_name: cleanString(member.plan),
        start_date: dateOrNull(member.start),
        expiry_date: dateOrNull(member.expiry),
        status: cleanString(member.status) || 'Active',
        visits: numberOrNull(member.visits) ?? 0,
        due_amount: numberOrNull(member.due) ?? 0,
        height: cleanString(member.height),
        weight: cleanString(member.weight),
        body_fat: cleanString(member.bodyFat),
        trainer_name: cleanString(member.trainer),
        referral_source: cleanString(member.referral),
        notes: cleanString(member.notes),
      };

      result = await supabase
        .from('members')
        .upsert(corePayload, {
          onConflict: 'gym_id,member_code',
        })
        .select('id, member_code')
        .single();
    }

    if (result.error) {
      throw new Error(
        `Member "${member.name}" (${legacyId}) failed: ${result.error.message}`
      );
    }

    memberMap.set(legacyId, result.data.id);

    count++;
  }

  log(`Members migrated: ${count}`);

  return memberMap;
}

async function migrateLeads(backup, gym) {
  const leads = backup.leads || [];

  let count = 0;

  for (const lead of leads) {
    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(lead.id),

      name: cleanString(lead.name),

      phone: cleanString(lead.phone),

      email: cleanString(lead.email),

      source: cleanString(lead.source),

      stage: cleanString(lead.stage) || 'New',

      follow_up_date: dateOrNull(lead.followUp),

      interested_plan: cleanString(lead.interestedPlan),

      notes: cleanString(lead.notes),

      converted_member_code: cleanString(
        lead.convertedMemberId
      ),

      converted_at: dateOrNull(lead.convertedAt),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const { error } = await supabase
      .from('leads')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `Lead "${lead.name}" failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Leads migrated: ${count}`);
}

async function findMemberId(memberCode, memberName, memberMap) {
  if (memberCode && memberMap.has(memberCode)) {
    return memberMap.get(memberCode);
  }

  if (memberName) {
    const { data, error } = await supabase
      .from('members')
      .select('id')
      .eq('name', memberName)
      .limit(1);

    if (!error && data?.length) {
      return data[0].id;
    }
  }

  return null;
}

async function migratePayments(backup, gym, memberMap) {
  const payments = backup.payments || [];

  let count = 0;

  for (const payment of payments) {
    const memberId = await findMemberId(
      payment.memberId,
      payment.member,
      memberMap
    );

    if (!memberId) {
      warn(
        `Payment ${payment.id}: member "${payment.member}" not found. Skipping.`
      );
      continue;
    }

    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(payment.id),

      member_id: memberId,

      amount: numberOrNull(payment.amount) ?? 0,

      payment_type: cleanString(payment.type) || 'Membership',

      payment_mode: cleanString(payment.mode),

      payment_date: dateOrNull(payment.date),

      notes: cleanString(payment.notes),
    };

    const { error } = await supabase
      .from('payments')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `Payment ${payment.id} failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Payments migrated: ${count}`);
}

async function migrateAttendance(backup, gym, memberMap) {
  const attendance = backup.attendance || [];

  let count = 0;

  for (const record of attendance) {
    const memberId = await findMemberId(
      record.memberId,
      record.member,
      memberMap
    );

    if (!memberId) {
      warn(
        `Attendance ${record.id}: member "${record.member}" not found. Skipping.`
      );
      continue;
    }

    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(record.id),

      member_id: memberId,

      attendance_date: dateOrNull(record.date),

      check_in_time: cleanString(record.time),

      latitude: numberOrNull(record.latitude),

      longitude: numberOrNull(record.longitude),

      distance_meters: numberOrNull(record.distance),

      source: cleanString(record.source) || 'manual',
    };

    const { error } = await supabase
      .from('attendance')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `Attendance ${record.id} failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Attendance records migrated: ${count}`);
}

async function migrateTrainers(backup, gym) {
  const trainers = backup.trainers || [];

  const trainerMap = new Map();

  let count = 0;

  for (const trainer of trainers) {
    const legacyId = cleanString(trainer.id);

    if (!legacyId) continue;

    const payload = {
      gym_id: gym.id,

      legacy_id: legacyId,

      name: cleanString(trainer.name),

      phone: cleanString(trainer.phone),

      specialization: cleanString(trainer.specialization),

      experience: cleanString(trainer.experience),

      status: cleanString(trainer.status) || 'Active',

      monthly_salary: numberOrNull(trainer.monthlySalary) ?? 0,

      notes: cleanString(trainer.notes),
    };

    const { data, error } = await supabase
      .from('trainers')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      })
      .select('id, legacy_id')
      .single();

    if (error) {
      throw new Error(
        `Trainer "${trainer.name}" failed: ${error.message}`
      );
    }

    trainerMap.set(legacyId, data.id);

    count++;
  }

  log(`Trainers migrated: ${count}`);

  return trainerMap;
}

async function migrateProgressRecords(backup, gym, memberMap) {
  const records = backup.progressRecords || [];

  let count = 0;

  for (const record of records) {
    const memberId = await findMemberId(
      record.memberId,
      record.memberName,
      memberMap
    );

    if (!memberId) {
      warn(
        `Progress ${record.id}: member not found. Skipping.`
      );
      continue;
    }

    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(record.id),

      member_id: memberId,

      record_date: dateOrNull(record.date),

      weight: numberOrNull(record.weight),

      body_fat: numberOrNull(record.bodyFat),

      chest: numberOrNull(record.chest),

      waist: numberOrNull(record.waist),

      hips: numberOrNull(record.hips),

      arms: numberOrNull(record.arms),

      thighs: numberOrNull(record.thighs),

      neck: numberOrNull(record.neck),

      notes: cleanString(record.notes),

      photos: jsonOrEmpty(record.photos, []),
    };

    const { error } = await supabase
      .from('progress_records')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `Progress record ${record.id} failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Progress records migrated: ${count}`);
}

async function migrateWorkoutPlans(backup, gym, memberMap) {
  const plans = backup.workoutPlans || [];

  let count = 0;

  for (const plan of plans) {
    const assignedMemberIds = (plan.assignedMemberIds || [])
      .map((legacyId) => memberMap.get(legacyId))
      .filter(Boolean);

    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(plan.id),

      name: cleanString(plan.name),

      goal: cleanString(plan.goal),

      level: cleanString(plan.level),

      duration_weeks: numberOrNull(plan.durationWeeks),

      trainer_name: cleanString(plan.trainer),

      notes: cleanString(plan.notes),

      assigned_member_ids: assignedMemberIds,

      exercises: jsonOrEmpty(plan.exercises, []),

      created_at: plan.createdAt || undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const { error } = await supabase
      .from('workout_plans')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `Workout plan "${plan.name}" failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Workout plans migrated: ${count}`);
}

async function migrateDietPlans(backup, gym, memberMap) {
  const plans = backup.dietPlans || [];

  let count = 0;

  for (const plan of plans) {
    const assignedMemberIds = (plan.assignedMemberIds || [])
      .map((legacyId) => memberMap.get(legacyId))
      .filter(Boolean);

    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(plan.id),

      name: cleanString(plan.name),

      goal: cleanString(plan.goal),

      calories: numberOrNull(plan.calories),

      protein: numberOrNull(plan.protein),

      duration_weeks: numberOrNull(plan.durationWeeks),

      coach: cleanString(plan.coach),

      notes: cleanString(plan.notes),

      assigned_member_ids: assignedMemberIds,

      meals: jsonOrEmpty(plan.meals, []),

      created_at: plan.createdAt || undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const { error } = await supabase
      .from('diet_plans')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `Diet plan "${plan.name}" failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Diet plans migrated: ${count}`);
}

async function migratePTSessions(backup, gym, memberMap, trainerMap) {
  const sessions = backup.ptSessions || [];

  let count = 0;

  for (const session of sessions) {
    const memberId = await findMemberId(
      session.memberId,
      session.member,
      memberMap
    );

    let trainerId = null;

    if (session.trainerId && trainerMap.has(session.trainerId)) {
      trainerId = trainerMap.get(session.trainerId);
    } else if (session.trainer) {
      const trainer = backup.trainers?.find(
        (item) => item.name === session.trainer
      );

      if (trainer?.id && trainerMap.has(trainer.id)) {
        trainerId = trainerMap.get(trainer.id);
      }
    }

    if (!memberId) {
      warn(
        `PT session ${session.id}: member not found. Skipping.`
      );
      continue;
    }

    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(session.id),

      member_id: memberId,

      trainer_id: trainerId,

      session_date: dateOrNull(
        session.date || session.sessionDate
      ),

      start_time: cleanString(session.startTime),

      end_time: cleanString(session.endTime),

      status: cleanString(session.status) || 'Scheduled',

      amount: numberOrNull(session.amount) ?? 0,

      notes: cleanString(session.notes),
    };

    const { error } = await supabase
      .from('pt_sessions')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `PT session ${session.id} failed: ${error.message}`
      );
    }

    count++;
  }

  log(`PT sessions migrated: ${count}`);
}

async function migrateCommunicationLogs(
  backup,
  gym,
  memberMap
) {
  const logs = backup.communicationLogs || [];

  let count = 0;

  for (const logRecord of logs) {
    const memberId = await findMemberId(
      logRecord.memberId,
      logRecord.member,
      memberMap
    );

    const payload = {
      gym_id: gym.id,

      legacy_id: cleanString(logRecord.id),

      member_id: memberId,

      channel: cleanString(logRecord.channel),

      direction: cleanString(logRecord.direction),

      subject: cleanString(logRecord.subject),

      message: cleanString(
        logRecord.message || logRecord.body || logRecord.notes
      ),

      status: cleanString(logRecord.status),

      sent_at: dateOrNull(
        logRecord.sentAt || logRecord.date || logRecord.createdAt
      ),
    };

    const { error } = await supabase
      .from('communication_logs')
      .upsert(payload, {
        onConflict: 'gym_id,legacy_id',
      });

    if (error) {
      throw new Error(
        `Communication log ${logRecord.id} failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Communication logs migrated: ${count}`);
}

async function migrateSettings(backup, gym) {
  const settings = backup.settings || {};

  const settingsToSave = {
    gymName: settings.gymName,
    currency: settings.currency,
    gymAddress: settings.gymAddress,
    gymPhone: settings.gymPhone,
    gymEmail: settings.gymEmail,
    gstin: settings.gstin,
    invoicePrefix: settings.invoicePrefix,
    referralPointsPerReferral:
      settings.referralPointsPerReferral,
    gymLatitude: settings.gymLatitude,
    gymLongitude: settings.gymLongitude,
  };

  let count = 0;

  for (const [key, value] of Object.entries(settingsToSave)) {
    if (value === undefined) continue;

    const payload = {
      gym_id: gym.id,
      setting_key: key,
      setting_value: value,
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert(payload, {
        onConflict: 'gym_id,setting_key',
      });

    if (error) {
      throw new Error(
        `Setting "${key}" failed: ${error.message}`
      );
    }

    count++;
  }

  log(`Settings migrated: ${count}`);
}

async function main() {
  console.log('');
  console.log('==========================================');
  console.log('   PREFACE FITNESS DATA MIGRATION');
  console.log('==========================================');
  console.log('');

  const backup = await readBackup();

  const gym = await getGym();

  log(`Target gym: ${gym.name}`);
  log(`Target gym ID: ${gym.id}`);

  console.log('');

  await migrateMembershipPlans(backup, gym);

  const memberMap = await migrateMembers(
    backup,
    gym
  );

  await migrateLeads(
    backup,
    gym
  );

  await migratePayments(
    backup,
    gym,
    memberMap
  );

  await migrateAttendance(
    backup,
    gym,
    memberMap
  );

  const trainerMap = await migrateTrainers(
    backup,
    gym
  );

  await migratePTSessions(
    backup,
    gym,
    memberMap,
    trainerMap
  );

  await migrateProgressRecords(
    backup,
    gym,
    memberMap
  );

  await migrateWorkoutPlans(
    backup,
    gym,
    memberMap
  );

  await migrateDietPlans(
    backup,
    gym,
    memberMap
  );

  await migrateCommunicationLogs(
    backup,
    gym,
    memberMap
  );

  await migrateSettings(
    backup,
    gym
  );

  console.log('');
  console.log('==========================================');
  console.log('   MIGRATION COMPLETED SUCCESSFULLY');
  console.log('==========================================');
  console.log('');
  console.log('Your local backup has been imported into');
  console.log('the Preface Fitness Supabase database.');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('==========================================');
  console.error('   MIGRATION FAILED');
  console.error('==========================================');
  console.error('');
  console.error(error?.message || error);
  console.error('');
  process.exit(1);
});