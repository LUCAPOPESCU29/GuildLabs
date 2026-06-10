import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
    response_type: "code",
    scope: "identify guilds",
  });
  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params}`
  );
}
