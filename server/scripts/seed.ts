/**
 * Database Seed
 * ─────────────
 * Populates the database with sample HireFlow data
 * 
 * Run with: npm run db:seed
 */

import { pool } from '../lib/db.js';

async function seed() {
  console.log('[DB] Seeding database...');

  try {
    // Create a demo user
    const userResult = await pool.query(`
      INSERT INTO users (id, name, email, role)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Tino Dube', 'tino@hireflow.io', 'admin')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `);
    const userId = userResult.rows[0]?.id;

    // Seed jobs
    await pool.query(`
      INSERT INTO jobs (id, title, dept, type, location, status, applicants, salary, skills, description, created_by)
      VALUES 
        ('job-001', 'Senior Product Designer', 'Design', 'Full-time', 'Remote', 'Open', 47, '$90k–$120k', 'Figma, Design Systems, Prototyping', 'We''re looking for a talented designer to join our growing team.', $1),
        ('job-002', 'Backend Engineer', 'Engineering', 'Full-time', 'Hybrid · London', 'Open', 83, '$100k–$140k', 'Node.js, PostgreSQL, AWS', 'Join our platform team to build scalable APIs and infrastructure.', $1),
        ('job-003', 'Head of Marketing', 'Marketing', 'Full-time', 'Remote', 'Open', 29, '$80k–$110k', 'SEO, Growth, Brand', 'Lead our marketing function through the next growth phase.', $1),
        ('job-004', 'Data Analyst', 'Data', 'Full-time', 'On-site · Harare', 'Open', 54, '$60k–$85k', 'SQL, Python, Tableau', 'Turn data into insights across our candidate and client pipelines.', $1),
        ('job-005', 'Product Manager', 'Product', 'Full-time', 'Remote', 'Draft', 0, '$95k–$130k', 'Roadmapping, Agile, JIRA', 'Define the roadmap for our ATS product suite.', $1),
        ('job-006', 'DevOps Engineer', 'Engineering', 'Contract', 'Remote', 'Paused', 18, '$120k–$160k', 'Kubernetes, Terraform, CI/CD', 'Help scale our infrastructure for global growth.', $1)
      ON CONFLICT (id) DO NOTHING
    `, [userId]);

    // Seed candidates
    await pool.query(`
      INSERT INTO candidates (id, name, email, role, stage, stage_key, source, score, applied)
      VALUES 
        ('c001', 'Lena Müller', 'lena@example.com', 'Product Designer', 'Final Round', 'Final', 'LinkedIn', 88, 'Mar 2'),
        ('c002', 'Amara Dube', 'amara@example.com', 'Product Designer', 'Offer Sent', 'Offer', 'Referral', 94, 'Feb 28'),
        ('c003', 'Marcus Khumalo', 'marcus@example.com', 'Backend Engineer', 'Screening', 'Screening', 'Direct', 72, 'Feb 24'),
        ('c004', 'Priya Nair', 'priya@example.com', 'Head of Marketing', 'Interview', 'Interview', 'LinkedIn', 81, 'Feb 18'),
        ('c005', 'Zanele Moyo', 'zanele@example.com', 'Product Designer', 'Applied', 'Applied', 'Job Board', 65, 'Mar 14'),
        ('c006', 'Kwame Osei', 'kwame@example.com', 'Data Analyst', 'Rejected', 'Rejected', 'Direct', 44, 'Mar 10'),
        ('c007', 'Sofia Reyes', 'sofia@example.com', 'Backend Engineer', 'Interview', 'Interview', 'LinkedIn', 79, 'Mar 5'),
        ('c008', 'Ahmed Hassan', 'ahmed@example.com', 'Backend Engineer', 'Final Round', 'Final', 'Referral', 85, 'Mar 1')
      ON CONFLICT (id) DO NOTHING
    `);

    // Seed interviews
    await pool.query(`
      INSERT INTO interviews (id, candidate, role, type, date, time, duration, interviewers, video_link, status)
      VALUES 
        (1, 'Lena Müller', 'Product Designer', 'Final', '2026-03-16', '10:00', 60, 'Tino Dube', 'meet.google.com/hf-abc111', 'Scheduled'),
        (2, 'Kwame Osei', 'Data Analyst', 'Technical', '2026-03-16', '14:30', 90, 'James Khumalo', 'meet.google.com/hf-abc222', 'Completed'),
        (3, 'Priya Nair', 'Head of Marketing', 'Screening', '2026-03-16', '16:00', 30, 'Sarah Moyo', 'meet.google.com/hf-abc333', 'No-show'),
        (4, 'Sofia Reyes', 'Backend Engineer', 'Screening', '2026-03-17', '10:00', 30, 'Tino Dube', 'meet.google.com/hf-abc444', 'Scheduled'),
        (5, 'Ahmed Hassan', 'Backend Engineer', 'Final', '2026-03-18', '13:00', 60, 'Tino Dube, Sarah', 'meet.google.com/hf-abc555', 'Scheduled'),
        (6, 'Zanele Moyo', 'Product Designer', 'Culture', '2026-03-18', '15:00', 30, 'Sarah Moyo', 'meet.google.com/hf-abc666', 'Scheduled')
      ON CONFLICT (id) DO NOTHING
    `);

    // Seed emails
    await pool.query(`
      INSERT INTO emails (id, from_name, from_addr, subject, preview, body, time, unread)
      VALUES 
        ('e1', 'Lena Müller', 'lena@example.com', 'Re: Final round scheduling', 'Hi Tino, I''m available tomorrow at 10am…', 'Hi Tino,\n\nThanks for reaching out about the final round. I''m really looking forward to it.\n\nI''m available tomorrow from 9am–12pm or after 3pm.\n\n— Lena', '10:24 AM', false),
        ('e2', 'Kwame Osei', 'kwame@example.com', 'Technical assessment question', 'Just wanted to clarify one thing…', 'Hi,\n\nJust wanted to clarify one thing about the technical assessment. Are we expected to use a specific framework or is the choice up to us?\n\nThanks,\nKwame', '9:51 AM', true),
        ('e3', 'Amara Dube', 'amara@example.com', 'Offer letter — thank you!', 'Hi, I''m so excited about this…', 'Hi Tino,\n\nI''m so excited about this opportunity! I''ve reviewed the offer letter and I''m thrilled to accept.\n\nWhen should I expect the onboarding paperwork?\n\nBest,\nAmara', 'Yesterday', false),
        ('e4', 'Priya Nair', 'priya@example.com', 'Interview feedback request', 'Any update on my interview?', 'Hello,\n\nI wanted to follow up on our interview from last week. Is there any feedback or update you can share?\n\nBest,\nPriya', 'Yesterday', true),
        ('e5', 'Marcus Khumalo', 'marcus@example.com', 'Portfolio link updated', 'Here''s the updated portfolio link…', 'Hi Tino,\n\nJust wanted to share my updated portfolio link: portfolio.marcus.dev\n\nIt includes my latest backend projects.\n\nThanks,\nMarcus', 'Mar 14', true)
      ON CONFLICT (id) DO NOTHING
    `);

    // Seed audit log
    await pool.query(`
      INSERT INTO audit_log (id, actor, action, details)
      VALUES 
        (gen_random_uuid(), 'Tino Dube', 'Advanced Lena Müller from Screening → Final Round', NULL),
        (gen_random_uuid(), 'Tino Dube', 'Sent Offer Letter to Amara Dube', NULL),
        (gen_random_uuid(), 'James K.', 'Submitted scorecard for Priya Nair — Score: 4.2/5', NULL),
        (gen_random_uuid(), 'Tino Dube', 'Posted new job: Data Analyst', NULL),
        (gen_random_uuid(), 'Sarah M.', 'Added candidate Zanele Moyo via Job Board', NULL),
        (gen_random_uuid(), 'Tino Dube', 'Scheduled interview for Lena Müller — Mon 16 10:00', NULL),
        (gen_random_uuid(), 'System', 'AI CV analysis completed for Marcus Khumalo — 72', NULL)
    `);

    // Seed activity log
    await pool.query(`
      INSERT INTO activity_log (id, color, text)
      VALUES 
        (gen_random_uuid(), 'var(--green)', '<strong>Amara Dube</strong> accepted the offer for <strong>Senior Designer</strong>'),
        (gen_random_uuid(), 'var(--blue2)', '<strong>Marcus Khumalo</strong> moved to <strong>Final Interview</strong>'),
        (gen_random_uuid(), 'var(--amber)', 'Scorecard submitted for <strong>Priya Nair</strong> — CV Score 4.2/5'),
        (gen_random_uuid(), 'var(--blue2)', '<strong>12 new applications</strong> received for <strong>Backend Engineer</strong>'),
        (gen_random_uuid(), 'var(--green)', '<strong>Lena Müller</strong> booked her final round for tomorrow at 10am')
    `);

    console.log('[DB] Seed completed successfully!');
  } catch (err) {
    console.error('[DB] Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();