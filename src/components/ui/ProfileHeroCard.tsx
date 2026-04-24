import type { ReactNode } from 'react';

interface ProfileHeroCardProps {
  fullName: string | null | undefined;
  email: string | null | undefined;
  nickname?: string | null;
  avatarUrl?: string | null;
  /** Acciones a mostrar debajo del avatar (ej: botón editar). */
  action?: ReactNode;
}

export function ProfileHeroCard({
  fullName,
  email,
  nickname,
  avatarUrl,
  action,
}: ProfileHeroCardProps) {
  const initials = getInitials(fullName, email);

  return (
    <section
      className="shadow-card relative overflow-hidden rounded-[24px] border p-6 sm:p-8"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full opacity-25 blur-3xl"
        style={{ background: 'var(--grad-primary)' }}
      />

      <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <div className="bg-grad-primary flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold text-white shadow-cta">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName ?? email ?? 'Avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="mt-4 min-w-0 flex-1 sm:mt-0">
          <h2 className="font-display truncate text-2xl text-white sm:text-3xl">
            {fullName ?? 'Usuario'}
          </h2>
          {nickname && (
            <p className="mt-1 text-sm text-white/60">@{nickname}</p>
          )}
          {email && (
            <p className="mt-1 truncate text-xs text-white/40">{email}</p>
          )}
        </div>

        {action && <div className="mt-4 sm:mt-0">{action}</div>}
      </div>
    </section>
  );
}

function getInitials(
  fullName: string | null | undefined,
  email: string | null | undefined,
) {
  const source = fullName?.trim() || email?.split('@')[0] || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
