/**
 * Database Seed
 * ─────────────
 * Populates the database with sample HireFlow data
 * 
 * Run with: npm run db:seed
 */

import { pool } from '../lib/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('[DB] Seeding database...');

  try {
    // Create demo users
    const hashedPassword = bcrypt.hashSync('Password123!', 10);
    const userResult = await pool.query(`
      INSERT INTO users (id, name, email, password, role)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Mika Sato', 'mika.sato@northgrid.io', $1, 'Admin')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [hashedPassword]);
    const userId = userResult.rows[0]?.id;

    await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES
        ('Ari Kunda', 'ari.kunda@northgrid.io', $1, 'Recruiter'),
        ('Lena Okafor', 'lena.okafor@northgrid.io', $1, 'Interviewer'),
        ('Devon Hale', 'devon.hale@northgrid.io', $1, 'Read-only'),
        ('Ruth Mlambo', 'ruth.mlambo@northgrid.io', $1, 'Recruiter')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    // Seed jobs
    await pool.query(`
      INSERT INTO jobs (title, dept, type, location, status, applicants, salary, skills, description, created_by)
      VALUES 
        ('Product Designer', 'Design', 'Full-time', 'Remote', 'Open', 32, '$80k-$105k', 'Figma, UX Research, Design Systems', 'Own end-to-end product design for our hiring platform.', $1),
        ('Backend Engineer', 'Engineering', 'Full-time', 'Hybrid - London', 'Open', 58, '$110k-$145k', 'Node.js, PostgreSQL, AWS', 'Build scalable APIs and data services for our ATS.', $1),
        ('Data Analyst', 'Data', 'Full-time', 'On-site - Harare', 'Open', 41, '$55k-$72k', 'SQL, Python, BI Tools', 'Turn product data into insights and reporting.', $1),
        ('Customer Success Manager', 'Customer', 'Full-time', 'Remote', 'Open', 19, '$60k-$75k', 'Onboarding, Retention, CRM', 'Drive adoption and outcomes for mid-market clients.', $1),
        ('Frontend Engineer', 'Engineering', 'Full-time', 'Remote', 'Draft', 0, '$95k-$125k', 'React, TypeScript, Vite', 'Own the recruiter dashboard experience.', $1),
        ('Security Analyst', 'Security', 'Contract', 'Remote', 'Paused', 7, '$70k-$95k', 'SOC, Incident Response, SIEM', 'Help improve our detection and response workflows.', $1),
        ('Software Developer (Junior)', 'Engineering', 'Full-time', 'On-site - Harare', 'Open', 12, '$20k-$28k', 'Java, PHP, JavaScript, MySQL, MongoDB, Debugging', 'Develop and maintain web and mobile applications.', $1)
    `, [userId]);

    // Seed candidates
    await pool.query(`
      INSERT INTO candidates (name, email, role, stage, stage_key, source, score, applied, cv_text, applied_at, screening_at, interview_at, final_at, offer_at, hired_at, rejected_at)
      VALUES 
        ('Ruth Mlambo', 'ruth.mlambo@northgrid.io', 'Product Designer', 'Final Round', 'Final', 'Portfolio', 90, 'Mar 3', NULL,
         '2026-03-03', '2026-03-07', '2026-03-12', '2026-03-18', NULL, NULL, NULL),
        ('Noah Patel', 'noah.patel@brightmail.co', 'Backend Engineer', 'Screening', 'Screening', 'LinkedIn', 76, 'Feb 27', NULL,
         '2026-02-27', '2026-03-01', NULL, NULL, NULL, NULL, NULL),
        ('Linda Chipo', 'linda.chipo@flowlabs.dev', 'Data Analyst', 'Interview', 'Interview', 'Referral', 81, 'Feb 22', NULL,
         '2026-02-22', '2026-02-26', '2026-03-05', NULL, NULL, NULL, NULL),
        ('Samir Okoye', 'samir.okoye@kivunet.ai', 'Customer Success Manager', 'Applied', 'Applied', 'Job Board', 68, 'Mar 14', NULL,
         '2026-03-14', NULL, NULL, NULL, NULL, NULL, NULL),
        ('Zoe Ncube', 'zoe.ncube@skyway.dev', 'Frontend Engineer', 'Applied', 'Applied', 'Direct', 64, 'Mar 12', NULL,
         '2026-03-12', NULL, NULL, NULL, NULL, NULL, NULL),
        ('Tawanda Moyo', 'tawanda.moyo@email.com', 'Software Developer (Junior)', 'Applied', 'Applied', 'CV Upload', 82, 'Apr 1',
         'Detail-oriented Junior Software Developer with strong foundations in full-stack development, database design, and software engineering principles. Experienced in building scalable web applications and solving real-world problems using Java, PHP, and JavaScript. Technical skills: Java, PHP, JavaScript, SQL, HTML5, CSS3, Bootstrap, Laravel (Basic), Node.js (Basic), MySQL, MongoDB, Git, REST APIs, SDLC, Agile. Assisted in developing and maintaining company web applications. Debugged and resolved system issues, improving performance by 20%.',
         '2026-04-01', NULL, NULL, NULL, NULL, NULL, NULL),
        ('Aisha Kelvin', 'aisha.kelvin@zenmetrics.com', 'Backend Engineer', 'Interview', 'Interview', 'Referral', 84, 'Mar 6', NULL,
         '2026-03-06', '2026-03-09', '2026-03-20', NULL, NULL, NULL, NULL),
        ('Marco Silva', 'marco.silva@westline.io', 'Security Analyst', 'Rejected', 'Rejected', 'Direct', 49, 'Mar 9', NULL,
         '2026-03-09', NULL, NULL, NULL, NULL, NULL, '2026-03-22')
    `);

    // Seed interviews
    await pool.query(`
      INSERT INTO interviews (candidate, role, type, date, time, duration, interviewers, video_link, status)
      VALUES 
        ('Ruth Mlambo', 'Product Designer', 'Final', '2026-03-18', '10:00', 60, 'Mika Sato', 'meet.google.com/ng-101', 'Scheduled'),
        ('Linda Chipo', 'Data Analyst', 'Technical', '2026-03-18', '14:30', 90, 'Ari Kunda', 'meet.google.com/ng-102', 'Completed'),
        ('Noah Patel', 'Backend Engineer', 'Screening', '2026-03-19', '11:00', 30, 'Lena Okafor', 'meet.google.com/ng-103', 'Scheduled'),
        ('Aisha Kelvin', 'Backend Engineer', 'Technical', '2026-03-20', '13:00', 60, 'Mika Sato', 'meet.google.com/ng-104', 'Scheduled')
    `);

    // Seed emails
    await pool.query(`
      INSERT INTO emails (from_name, from_addr, subject, preview, body, time, unread)
      VALUES 
        ('Ruth Mlambo', 'ruth.mlambo@northgrid.io', 'Re: Final round scheduling', 'Hi team, I can do Thursday morning.', 'Hi team\n\nI can do Thursday morning or Friday after 2pm.\n\nThanks,\nRuth', '10:24 AM', false),
        ('Noah Patel', 'noah.patel@brightmail.co', 'Technical assessment question', 'Quick question about the API task...', 'Hi\n\nIs it okay to use NestJS for the assessment?\n\nThanks,\nNoah', '9:51 AM', true),
        ('Linda Chipo', 'linda.chipo@flowlabs.dev', 'Interview follow-up', 'Thank you for the interview today.', 'Thanks for the interview today. I enjoyed learning about the data team.\n\nBest,\nLinda', 'Yesterday', false),
        ('Samir Okoye', 'samir.okoye@kivunet.ai', 'Portfolio link', 'Sharing my onboarding playbook...', 'Here is a link to my onboarding playbook and QBR template.\n\nSamir', 'Mar 14', true),
        ('Aisha Kelvin', 'aisha.kelvin@zenmetrics.com', 'Availability', 'I can do Tue or Wed afternoon.', 'Hi\n\nI can do Tue or Wed afternoon this week.\n\nAisha', 'Mar 12', false)
    `);

    // Seed audit log
    await pool.query(`
      INSERT INTO audit_log (id, actor, action, details)
      VALUES 
        (gen_random_uuid(), 'Mika Sato', 'Advanced Ruth Mlambo from Screening to Final Round', NULL),
        (gen_random_uuid(), 'System', 'AI CV analysis completed for Tawanda Moyo - 82', NULL),
        (gen_random_uuid(), 'Ari K.', 'Scheduled interview for Linda Chipo - Mar 18 14:30', NULL),
        (gen_random_uuid(), 'Mika Sato', 'Posted new job: Software Developer (Junior)', NULL),
        (gen_random_uuid(), 'System', 'Data export completed for March pipeline', NULL)
    `);

    // Seed activity log
    await pool.query(`
      INSERT INTO activity_log (id, color, text)
      VALUES 
        (gen_random_uuid(), 'var(--green)', '<strong>Ruth Mlambo</strong> moved to <strong>Final Round</strong>'),
        (gen_random_uuid(), 'var(--blue2)', '<strong>New role</strong> published: <strong>Software Developer (Junior)</strong>'),
        (gen_random_uuid(), 'var(--amber)', 'Scorecard submitted for <strong>Linda Chipo</strong> - 4.4/5'),
        (gen_random_uuid(), 'var(--blue2)', '<strong>9 new applications</strong> received for <strong>Backend Engineer</strong>'),
        (gen_random_uuid(), 'var(--green)', '<strong>Aisha Kelvin</strong> booked a technical interview')
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
