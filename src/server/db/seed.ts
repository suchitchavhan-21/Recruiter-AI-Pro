import bcrypt from "bcryptjs";
import { insertUser, findUserByEmail, listAllUsers } from "./repository";
import { User } from "./schema";

export async function runDatabaseSeed(options: { force?: boolean } = {}) {
  console.log("🌱 [DB SEED] Starting secure database seeding...");

  const existingUsers = await listAllUsers();
  if (existingUsers.length > 0 && !options.force) {
    console.log(`[DB SEED] Database already populated with ${existingUsers.length} users. Skipping auto-seed.`);
    return;
  }

  // 1. Candidate Test User
  const candidateEmail = "candidate@example.com";
  let candidate = await findUserByEmail(candidateEmail);
  if (!candidate) {
    const candidatePass = "CandidatePassword123!";
    const passwordHash = await bcrypt.hash(candidatePass, 10);
    
    candidate = {
      id: "u-dev-candidate-01",
      fullName: "Candidate Engineer",
      email: candidateEmail,
      phoneNumber: "+1 (555) 019-2834",
      passwordHash,
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
      role: "candidate",
      provider: "local",
      emailVerified: true,
      accountStatus: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await insertUser(candidate);
    console.log(`✅ [DB SEED] Created candidate user: ${candidateEmail}`);
  }

  // 2. Administrator Test User
  const adminEmail = "admin@coach.ai";
  let admin = await findUserByEmail(adminEmail);
  if (!admin) {
    const adminPass = "AdminPassword123!";
    const passwordHash = await bcrypt.hash(adminPass, 10);
    
    admin = {
      id: "u-dev-admin-01",
      fullName: "System Administrator",
      email: adminEmail,
      phoneNumber: "+1 (555) 019-9999",
      passwordHash,
      profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      role: "admin",
      provider: "local",
      emailVerified: true,
      accountStatus: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await insertUser(admin);
    console.log(`✅ [DB SEED] Created administrator user: ${adminEmail}`);
  }

  console.log("🌱 [DB SEED] Database seeding completed successfully.");
}

// Direct execution when invoked via `tsx src/server/db/seed.ts`
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  runDatabaseSeed({ force: true })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ [DB SEED ERROR]:", err);
      process.exit(1);
    });
}
