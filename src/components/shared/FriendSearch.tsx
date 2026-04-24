import { Search } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch.ts';
import { saveContact } from '@/services/contactsService.ts';
import { Input } from '@/components/ui/Input.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { useAuthStore } from '@/stores/authStore.ts';
import { NicknameRequired } from '@/components/shared/NicknameRequired.tsx';
import type { UserSearchResult } from '@/types/shared.ts';

interface FriendSearchProps {
  onSelect: (user: UserSearchResult) => void;
  excludeIds?: string[];
}

function Avatar({ user }: { user: UserSearchResult }) {
  const initial = (user.full_name || user.nickname).charAt(0).toUpperCase();
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{
        background: 'var(--grad-primary)',
        boxShadow: 'var(--shadow-cta)',
      }}
    >
      {initial}
    </div>
  );
}

function UserRow({
  user,
  onClick,
}: {
  user: UserSearchResult;
  onClick: (u: UserSearchResult) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(user)}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
    >
      <Avatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">
          @{user.nickname}
          {user.full_name ? (
            <span className="ml-1 font-normal text-white/50">
              · {user.full_name}
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-white/40">{user.masked_email}</p>
      </div>
    </button>
  );
}

export function FriendSearch({ onSelect, excludeIds = [] }: FriendSearchProps) {
  const user = useAuthStore((s) => s.user);
  const { query, setQuery, contacts, results, loading } = useUserSearch();

  if (!user?.nickname) {
    return <NicknameRequired />;
  }

  const handleSelect = (selected: UserSearchResult) => {
    onSelect(selected);
    setQuery('');
    saveContact(selected.id).catch(() => {});
  };

  const isSearching = query.length >= 2;
  const filteredResults = results.filter((u) => !excludeIds.includes(u.id));
  const filteredContacts = contacts.filter((c) => !excludeIds.includes(c.id));

  const showResults = isSearching && filteredResults.length > 0;
  const showContacts = !isSearching && filteredContacts.length > 0;

  return (
    <div className="relative">
      <Input
        placeholder="Buscar por @nickname..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftSlot={<Search className="h-4 w-4" />}
        rightSlot={loading ? <Spinner size="sm" /> : undefined}
      />

      {showResults && (
        <div
          className="shadow-card absolute z-10 mt-1 w-full overflow-hidden rounded-[14px] border"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          {filteredResults.map((u) => (
            <UserRow key={u.id} user={u} onClick={handleSelect} />
          ))}
        </div>
      )}

      {showContacts && !isSearching && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/40">
            Mis contactos
          </p>
          <div
            className="overflow-hidden rounded-[14px] border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {filteredContacts.map((c) => (
              <UserRow key={c.id} user={c} onClick={handleSelect} />
            ))}
          </div>
        </div>
      )}

      {isSearching && !loading && filteredResults.length === 0 && (
        <div
          className="shadow-card absolute z-10 mt-1 w-full rounded-[14px] border px-4 py-3"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="text-sm text-white/50">
            No se encontraron usuarios con ese @nickname
          </p>
        </div>
      )}
    </div>
  );
}
