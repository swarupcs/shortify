import { db } from "./index";
import { users, urls, userRoleEnum } from "./schema";
import { nanoid } from "nanoid";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";

export async function seed() {
  console.log("Seeding database...");
  try {
    const testUsers = [
      { id: randomUUID(), name: "Test User", email: "test@example.com", password: await hash("password123", 10), role: userRoleEnum.enumValues[0], createdAt: new Date(), updatedAt: new Date() },
      { id: randomUUID(), name: "Demo User", email: "demo@example.com", password: await hash("demo123", 10), role: userRoleEnum.enumValues[0], createdAt: new Date(), updatedAt: new Date() },
      { id: randomUUID(), name: "Admin User", email: "admin@example.com", password: await hash("admin123", 10), role: userRoleEnum.enumValues[1], createdAt: new Date(), updatedAt: new Date() },
    ];
    for (const user of testUsers) {
      try { await db.insert(users).values(user).onConflictDoNothing(); console.log(`Created user: ${user.email}`); }
      catch (error) { console.error(`Error creating user ${user.email}:`, error); }
    }
    const insertedUsers = await db.query.users.findMany({
      where: (users, { eq, or }) => or(eq(users.email, "test@example.com"), eq(users.email, "demo@example.com"), eq(users.email, "admin@example.com")),
    });
    if (insertedUsers.length === 0) throw new Error("Failed to retrieve inserted users");
    const testUrls = [
      { originalUrl: "https://github.com", shortCode: "github", createdAt: new Date(Date.now() - 7*24*60*60*1000), updatedAt: new Date(Date.now() - 7*24*60*60*1000), clicks: 42, userId: insertedUsers[0].id },
      { originalUrl: "https://nextjs.org", shortCode: "nextjs", createdAt: new Date(Date.now() - 5*24*60*60*1000), updatedAt: new Date(Date.now() - 5*24*60*60*1000), clicks: 27, userId: insertedUsers[0].id },
      { originalUrl: "https://tailwindcss.com", shortCode: "tailwind", createdAt: new Date(Date.now() - 3*24*60*60*1000), updatedAt: new Date(Date.now() - 3*24*60*60*1000), clicks: 15, userId: insertedUsers[0].id },
      { originalUrl: "https://react.dev", shortCode: "react", createdAt: new Date(Date.now() - 6*24*60*60*1000), updatedAt: new Date(Date.now() - 6*24*60*60*1000), clicks: 31, userId: insertedUsers[1].id },
      { originalUrl: "https://typescriptlang.org", shortCode: "typescript", createdAt: new Date(Date.now() - 4*24*60*60*1000), updatedAt: new Date(Date.now() - 4*24*60*60*1000), clicks: 19, userId: insertedUsers[1].id },
      { originalUrl: "https://example.com", shortCode: "example", createdAt: new Date(Date.now() - 2*24*60*60*1000), updatedAt: new Date(Date.now() - 2*24*60*60*1000), clicks: 8, userId: null },
      { originalUrl: "https://google.com", shortCode: "google", createdAt: new Date(Date.now() - 1*24*60*60*1000), updatedAt: new Date(Date.now() - 1*24*60*60*1000), clicks: 53, userId: null },
    ];
    for (const url of testUrls) {
      try { await db.insert(urls).values(url).onConflictDoNothing(); console.log(`Created URL: ${url.shortCode}`); }
      catch (error) { console.error(`Error creating URL ${url.shortCode}:`, error); }
    }
    for (let i = 0; i < 10; i++) {
      const randomUrl = { originalUrl: `https://random-site-${i+1}.com`, shortCode: nanoid(6), createdAt: new Date(Date.now() - Math.floor(Math.random()*10)*24*60*60*1000), updatedAt: new Date(), clicks: Math.floor(Math.random()*100), userId: Math.random() > 0.5 ? insertedUsers[Math.floor(Math.random()*insertedUsers.length)].id : null };
      try { await db.insert(urls).values(randomUrl); }
      catch (error) { console.error("Error creating random URL:", error); }
    }
    console.log("Seeding completed!");
    return { success: true };
  } catch (error) {
    console.error("Seeding failed:", error);
    return { success: false, error };
  }
}
