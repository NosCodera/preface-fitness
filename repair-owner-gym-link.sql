-- Repairs the local owner account to the existing imported gym.
-- Does not delete or rewrite business data.
PRAGMA foreign_keys = ON;

-- Ensure the signed-in owner points to the only/imported gym.
UPDATE users
SET gym_id = (SELECT id FROM gyms ORDER BY created_at LIMIT 1),
    role = 'owner',
    is_active = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE lower(email) = lower('prefacefitness@gmail.com')
  AND EXISTS (SELECT 1 FROM gyms);

-- Ensure owner access mapping exists and is active for that same gym.
INSERT INTO gym_users (id, gym_id, role, permissions_json, is_active, created_at)
SELECT u.id, u.gym_id, 'owner', '{}', 1, CURRENT_TIMESTAMP
FROM users u
WHERE lower(u.email) = lower('prefacefitness@gmail.com')
  AND EXISTS (SELECT 1 FROM gyms)
ON CONFLICT(id) DO UPDATE SET
  gym_id = excluded.gym_id,
  role = 'owner',
  permissions_json = '{}',
  is_active = 1;

-- Keep any current local sessions aligned with the repaired owner gym.
UPDATE sessions
SET gym_id = (SELECT u.gym_id FROM users u WHERE u.id = sessions.user_id)
WHERE user_id IN (SELECT id FROM users WHERE lower(email) = lower('prefacefitness@gmail.com'));

-- Report the resulting mapping for verification.
SELECT u.id AS user_id, u.email, u.gym_id, u.role AS user_role,
       gu.role AS access_role, gu.is_active AS access_active,
       g.name AS gym_name
FROM users u
LEFT JOIN gym_users gu ON gu.id = u.id AND gu.gym_id = u.gym_id
LEFT JOIN gyms g ON g.id = u.gym_id
WHERE lower(u.email) = lower('prefacefitness@gmail.com');
