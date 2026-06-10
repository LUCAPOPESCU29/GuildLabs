import type { Metadata } from "next";
import { LegalDoc, type LegalSection } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "GuildLabs terms of service — acceptable use, AI and market-data disclaimers, open-source licensing, and liability.",
};

const UPDATED = "June 2025";

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: (
      <p>
        By using GuildLabs — the website, the Construct builder, ChartIt, Maven, or any related
        bot — you agree to these terms. If you don&apos;t agree, please don&apos;t use the service.
        You also agree to Discord&apos;s{" "}
        <a href="https://discord.com/terms" target="_blank" rel="noreferrer">Terms of Service</a>{" "}
        and Community Guidelines.
      </p>
    ),
  },
  {
    id: "the-service",
    title: "The service",
    body: (
      <p>
        GuildLabs is a free studio of open-source Discord tools: <strong>Construct</strong> turns a
        description or step-by-step choices into a deployable server blueprint, <strong>ChartIt</strong>{" "}
        renders live market charts, and <strong>Maven</strong> surfaces previously answered
        questions. The tools are provided free of charge and may change or be discontinued at any
        time.
      </p>
    ),
  },
  {
    id: "ai-and-market-disclaimer",
    title: "AI & market-data disclaimer",
    body: (
      <>
        <p>
          Construct&apos;s blueprints are <strong>AI-generated and may be imperfect</strong>. You are
          shown the full result to review and edit, and <strong>you</strong> decide what to deploy to
          your server — so always check it first. You are responsible for the channels, roles, and
          permissions you create.
        </p>
        <p>
          ChartIt&apos;s quotes and news are provided by third parties, may be delayed or inaccurate,
          and are for informational purposes only. <strong>Nothing in GuildLabs is financial,
          investment, or legal advice.</strong>
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use GuildLabs to violate Discord&apos;s policies or any applicable law;</li>
          <li>deploy content that is illegal, hateful, or abusive;</li>
          <li>attempt to disrupt, overload, reverse-engineer, or gain unauthorized access to the service or its infrastructure;</li>
          <li>abuse the AI or API endpoints (e.g. automated scraping or circumventing rate limits).</li>
        </ul>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <p>
        Descriptions and blueprints you create are yours. By using the AI flow you grant us the
        limited right to process that content (including sending it to our AI provider) solely to
        generate your result. You are responsible for ensuring you have the rights to anything you
        submit and to anything you deploy.
      </p>
    ),
  },
  {
    id: "open-source",
    title: "Open source & licensing",
    body: (
      <p>
        GuildLabs bots are released under the <strong>MIT license</strong>. You&apos;re free to
        self-host, modify, and redistribute them under the terms of that license. The source is on{" "}
        <a href="https://github.com/LUCAPOPESCU29/GuildLabs" target="_blank" rel="noreferrer">GitHub</a>.
      </p>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: (
      <p>
        GuildLabs depends on services we don&apos;t control — Discord, our AI provider (Groq),
        hosting (Vercel), and market-data providers. Your use of those features is also subject to
        their terms, and we&apos;re not responsible for their availability or actions.
      </p>
    ),
  },
  {
    id: "warranty",
    title: "No warranty",
    body: (
      <p>
        The service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>,
        without warranties of any kind, express or implied, including merchantability, fitness for a
        particular purpose, and non-infringement. We don&apos;t guarantee the service will be
        uninterrupted, error-free, or that AI output will be accurate.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, GuildLabs and its maintainers will not be liable for
        any indirect, incidental, or consequential damages, or any loss of data, servers, or
        profits, arising from your use of (or inability to use) the service — including anything you
        deploy to your Discord server.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes & contact",
    body: (
      <p>
        We may update these terms as the product evolves; the &ldquo;last updated&rdquo; date above
        reflects the latest version, and continued use constitutes acceptance. Questions? Reach us on{" "}
        <a href="https://github.com/LUCAPOPESCU29/GuildLabs/issues/new" target="_blank" rel="noreferrer">GitHub</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated={UPDATED}
      intro={
        <p>
          The rules for using GuildLabs&apos; free, open-source Discord tools — acceptable use, the
          AI and market-data disclaimers, licensing, and liability. Plain English, no surprises.
        </p>
      }
      sections={sections}
    />
  );
}
