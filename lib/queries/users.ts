import { sql } from "@/lib/db"

export async function getUsers() {
  return await sql`
    SELECT 
      a.id,
      a.name,
      a.email,
      a.role,
      a.status,
      CASE 
        WHEN a.role = 'SUPERADMIN' THEN 'All'
        ELSE COALESCE(
          (
            SELECT string_agg(REPLACE(b.name, 'ER Coffeelab ', ''), ', ')
            FROM branch_admins ba
            JOIN branches b ON b.id = ba.branch_id
            WHERE ba.admin_id = a.id
          ),
          'None'
        )
      END as branch,
      (
        SELECT COALESCE(json_agg(ba.branch_id), '[]'::json)
        FROM branch_admins ba
        WHERE ba.admin_id = a.id
      ) as branch_ids
    FROM admins a
    ORDER BY a.created_at DESC
  `
}

export async function createUser(data: any) {
  const newAdmins = await sql`
    INSERT INTO admins (name, email, password_hash, role, status)
    VALUES (${data.name}, ${data.email}, ${data.passwordHash}, ${data.role}, ${data.status})
    RETURNING id, name, email, role, status
  `
  const adminId = newAdmins[0].id

  if (data.role === 'STORE_ADMIN' && data.branchIds && data.branchIds.length > 0) {
    for (const branchId of data.branchIds) {
      await sql`INSERT INTO branch_admins (branch_id, admin_id) VALUES (${branchId}, ${adminId})`
    }
  }
  
  return newAdmins
}

export async function updateUser(id: number, data: any) {
  let updatedAdmins;
  if (data.passwordHash) {
    updatedAdmins = await sql`
      UPDATE admins 
      SET name = ${data.name}, email = ${data.email}, password_hash = ${data.passwordHash}, role = ${data.role}, status = ${data.status}
      WHERE id = ${id}
      RETURNING id, name, email, role, status
    `
  } else {
    updatedAdmins = await sql`
      UPDATE admins 
      SET name = ${data.name}, email = ${data.email}, role = ${data.role}, status = ${data.status}
      WHERE id = ${id}
      RETURNING id, name, email, role, status
    `
  }

  // Update branches
  await sql`DELETE FROM branch_admins WHERE admin_id = ${id}`
  if (data.role === 'STORE_ADMIN' && data.branchIds && data.branchIds.length > 0) {
    for (const branchId of data.branchIds) {
      await sql`INSERT INTO branch_admins (branch_id, admin_id) VALUES (${branchId}, ${id})`
    }
  }

  return updatedAdmins
}

export async function deleteUser(id: number) {
  return await sql`
    DELETE FROM admins
    WHERE id = ${id}
    RETURNING id
  `
}
