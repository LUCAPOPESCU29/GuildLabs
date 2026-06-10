import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/base-url";

export async function GET(req: NextRequest) {
  const store = await cookies();
  store.delete("forge_session");
  return NextResponse.redirect(`${getBaseUrl(req)}/dashboard`);
}
