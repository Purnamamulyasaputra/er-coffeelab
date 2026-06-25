import { NextRequest, NextResponse } from "next/server"
import { getActivePaymentMethods } from "@/lib/queries/payment-methods"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("pos") || await getSession("admin")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const data = await getActivePaymentMethods()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
