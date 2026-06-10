import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/base-url";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${getBaseUrl(req)}/api/auth/callback`,
    response_type: "code",
    scope: "identify guilds",
  });
  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params}`
  );
}
