import { SignJWT, jwtVerify, decodeJwt } from "jose"
import { cookies } from "next/headers"

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_key"
)

export async function signToken(payload: any) {
  const alg = "HS256"
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload
  } catch (error) {
    return null
  }
}

export async function setAuthCookie(token: string, type: "admin" | "pos" = "admin") {
  const cookieName = type === "admin" ? "admin_token" : "pos_token"
  const cookieStore = await cookies()
  cookieStore.set(cookieName, token, {
    httpOnly: false, // Set to false to allow TabSessionSync (multi-tab isolation)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })
}

export async function getSession(type: "admin" | "pos" = "admin") {
  const cookieName = type === "admin" ? "admin_token" : "pos_token"
  const cookieStore = await cookies()
  const token = cookieStore.get(cookieName)?.value
  if (!token) return null
  return await verifyToken(token)
}

export async function requireAdmin() {
  const session = await getSession("admin") as any
  if (!session) {
    throw new Error("Unauthorized")
  }

  const cookieStore = await cookies()
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value

  // If STORE_ADMIN or EMPLOYEE, force their own branch
  // If SUPERADMIN, use selected branch from cookie, or return null (all branches)
  const resolvedBranchId = (session.role === "STORE_ADMIN" || session.role === "EMPLOYEE")
    ? (session.branchId || 1) 
    : (selectedBranchId && selectedBranchId !== "all" ? Number(selectedBranchId) : null)

  return {
    ...session,
    resolvedBranchId
  }
}

