#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/hash-admin-password.js
   Generates a hashed admin user record for the
   ADMIN_USERS environment variable.

   Usage:
     node scripts/hash-admin-password.js <username> <role> <password>

   Roles: admin | marketing | content | cs | host

   Run once per user, then combine the printed objects into a
   single JSON array and set it as ADMIN_USERS in Vercel.
═══════════════════════════════════════════════════ */

const { hashPassword, makeSalt } = require('../api/_lib/auth');

const [, , username, role, password] = process.argv;

if (!username || !role || !password) {
  console.error('Usage: node scripts/hash-admin-password.js <username> <role> <password>');
  console.error('Roles: admin | marketing | content | cs | host');
  process.exit(1);
}

const VALID_ROLES = ['admin', 'marketing', 'content', 'cs', 'host'];
if (!VALID_ROLES.includes(role)) {
  console.error(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

if (password.length < 12) {
  console.error('Refusing: password must be at least 12 characters.');
  process.exit(1);
}

const salt = makeSalt();
const hash = hashPassword(password, salt);

console.log(JSON.stringify({ u: username.toLowerCase().trim(), role, salt, hash }));
