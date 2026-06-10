import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const store = await cookies();
  store.delete("forge_session");
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
}
