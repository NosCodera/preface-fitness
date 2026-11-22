SELECT 'gyms' AS table_name, COUNT(*) AS total FROM gyms
UNION ALL SELECT 'membership_plans', COUNT(*) FROM membership_plans
UNION ALL SELECT 'members', COUNT(*) FROM members
UNION ALL SELECT 'trainers', COUNT(*) FROM trainers
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'pt_sessions', COUNT(*) FROM pt_sessions
UNION ALL SELECT 'workout_plans', COUNT(*) FROM workout_plans
UNION ALL SELECT 'diet_plans', COUNT(*) FROM diet_plans
UNION ALL SELECT 'leads', COUNT(*) FROM leads
UNION ALL SELECT 'app_settings', COUNT(*) FROM app_settings
ORDER BY table_name;
