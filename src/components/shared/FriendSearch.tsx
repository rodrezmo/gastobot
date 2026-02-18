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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
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
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <Avatar user={user} />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          @{user.nickname}
          {user.full_name ? (
            <span className="ml-1 font-normal text-gray-500">· {user.full_name}</span>
          ) : null}
        </p>
        <p className="text-xs text-gray-500">{user.masked_email}</p>
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
    // Save to contacts silently (fire & forget)
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
      />
      {loading && <Spinner size="sm" className="absolute right-3 top-2.5" />}

      {/* Search results dropdown */}
      {showResults && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filteredResults.map((u) => (
            <UserRow key={u.id} user={u} onClick={handleSelect} />
          ))}
        </div>
      )}

      {/* Contacts shown when not searching */}
      {showContacts && !isSearching && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Mis contactos
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {filteredContacts.map((c) => (
              <UserRow key={c.id} user={c} onClick={handleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* No results while searching */}
      {isSearching && !loading && filteredResults.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500">No se encontraron usuarios con ese @nickname</p>
        </div>
      )}
    </div>
  );
}
