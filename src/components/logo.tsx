export function GuildLabsLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <>
      {/* Dark theme — white logo */}
      <img
        src="/GuildLabs Logo - R2 -transparent- copy.png"
        alt="GuildLabs"
        className={`${className} hidden dark:block`}
      />
      {/* Light theme — purple logo */}
      <img
        src="/GuildLabs Logo - R2 -transparent-.png"
        alt="GuildLabs"
        className={`${className} block dark:hidden`}
      />
    </>
  );
}
