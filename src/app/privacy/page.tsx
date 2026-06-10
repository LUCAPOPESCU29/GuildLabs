import type { Metadata } from "next";
import { LegalDoc, type LegalSection } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "GuildLabs privacy policy — exactly what data each tool collects, who processes it, how long we keep it, and how to delete it.",
};

const UPDATED = "June 2025";

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        <p>
          GuildLabs is a small, open-source studio of free Discord tools — <strong>Construct</strong>{" "}
          (an AI server builder), <strong>ChartIt</strong> (live market charts), and{" "}
          <strong>Maven</strong> (community Q&amp;A). This policy explains, in plain English, what
          each tool collects, who else processes it, and the control you have over it.
        </p>
        <p>
          The short version: <strong>we don&apos;t sell your data, we don&apos;t run advertising or
          tracking cookies, and we collect the minimum needed to make the tools work.</strong>
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>Depending on which tools you use, we may process:</p>
        <ul>
          <li>
            <strong>Account info (via Discord OAuth)</strong> — your Discord user ID, username,
            avatar, and the list of servers you can manage. We request only what&apos;s needed to
            show your dashboard and deploy to a server you choose.
          </li>
          <li>
            <strong>Session</strong> — a signed cookie (JWT) that keeps you logged in. It contains
            your Discord ID and an access token; it is not readable by JavaScript and expires
            after 7 days.
          </li>
          <li>
            <strong>Optional contact</strong> — if you choose to enter an email in the Construct
            terms step, we store it only to send product updates. It&apos;s never required.
          </li>
          <li>
            <strong>Technical/usage</strong> — standard server logs (IP address, request time)
            used for security, abuse prevention, and rate limiting. We do not build advertising
            profiles.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "construct-ai",
    title: "Construct (AI builder)",
    body: (
      <>
        <p>
          When you use the &ldquo;Describe it&rdquo; flow, the text you write and your answers to
          the clarifying questions are sent to <strong>Groq</strong> (our AI provider) to generate
          a server blueprint. Keep these points in mind:
        </p>
        <ul>
          <li>The blueprint is shown to you to <strong>review and edit before anything is deployed</strong> — nothing is created on your server automatically.</li>
          <li>If no AI key is configured, an on-device fallback generates the blueprint and no text leaves the server.</li>
          <li>Don&apos;t paste secrets or sensitive personal data into the description box.</li>
        </ul>
        <p>
          See Groq&apos;s{" "}
          <a href="https://groq.com/privacy-policy/" target="_blank" rel="noreferrer">privacy policy</a>{" "}
          for how they handle prompts.
        </p>
      </>
    ),
  },
  {
    id: "chartit",
    title: "ChartIt (market data)",
    body: (
      <p>
        When you open a chart, the ticker symbol you request is sent to third-party market-data
        providers to fetch quotes, history, and news. These requests carry the symbol only — no
        Discord identity or personal data is attached. Market data is informational and may be
        delayed; it is <strong>not financial advice</strong>.
      </p>
    ),
  },
  {
    id: "maven",
    title: "Maven (community Q&A)",
    body: (
      <>
        <p>
          Maven runs on the server hosting it and stores its data <strong>locally</strong> —
          nothing is sent to external AI APIs. It keeps:
        </p>
        <ul>
          <li>the text of detected questions and the replies that follow them,</li>
          <li>message, channel, and user IDs needed to link answers,</li>
          <li>a 384-dimension embedding vector per question (for similarity search), and</li>
          <li>feedback counters.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        We use a single <strong>session cookie</strong> for authentication and a local preference
        for your theme. We do <strong>not</strong> use advertising or cross-site tracking cookies.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party processors",
    body: (
      <>
        <p>We rely on a few reputable providers to run the service:</p>
        <ul>
          <li><strong>Discord</strong> — authentication and bot functionality (<a href="https://discord.com/privacy" target="_blank" rel="noreferrer">privacy</a>).</li>
          <li><strong>Groq</strong> — AI generation for Construct (<a href="https://groq.com/privacy-policy/" target="_blank" rel="noreferrer">privacy</a>).</li>
          <li><strong>Vercel</strong> — web hosting and serverless functions (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">privacy</a>).</li>
          <li><strong>Market-data providers</strong> — quotes and news for ChartIt.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention-deletion",
    title: "Data retention & deletion",
    body: (
      <>
        <p>
          We keep account and dashboard data only while you use the service. Session cookies
          expire after 7 days. You can sign out at any time to clear your session.
        </p>
        <p>
          To request deletion of any data we hold, open an issue on{" "}
          <a href="https://github.com/LUCAPOPESCU29/GuildLabs/issues/new" target="_blank" rel="noreferrer">GitHub</a>{" "}
          and we&apos;ll remove it.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        GuildLabs is intended for Discord users who meet Discord&apos;s minimum age requirement (13,
        or higher where local law requires). We do not knowingly collect data from anyone under
        that age.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes & contact",
    body: (
      <p>
        We may update this policy as the product evolves; material changes will be reflected in the
        &ldquo;last updated&rdquo; date above. Questions or requests? Reach us on{" "}
        <a href="https://github.com/LUCAPOPESCU29/GuildLabs/issues/new" target="_blank" rel="noreferrer">GitHub</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated={UPDATED}
      intro={
        <p>
          How GuildLabs handles your data across Construct, ChartIt, and Maven — what we collect,
          who processes it, and how to delete it. No selling, no tracking ads.
        </p>
      }
      sections={sections}
    />
  );
}
