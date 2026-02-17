import { useUserSearch } from '@/hooks/useUserSearch.ts';
import { Input } from '@/components/ui/Input.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import type { UserSearchResult } from '@/types/shared.ts';

interface FriendSearchProps {
  onSelect: (user: UserSearchResult) => void;
  excludeIds?: string[];
}

export function FriendSearch({ onSelect, excludeIds = [] }: FriendSearchProps) {
  const { query, setQuery, results, loading } = useUserSearch();

  const filtered = results.filter((u) => !excludeIds.includes(u.id));

  return (
    <div className="relative">
      <Input
        placeholder="Buscar por email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <Spinner size="sm" className="absolute right-3 top-2.5" />}
      {filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onSelect(user);
                setQuery('');
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
