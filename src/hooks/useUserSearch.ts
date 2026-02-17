import { useState, useEffect } from 'react';
import { searchUsersByEmail } from '@/services/sharedService.ts';
import type { UserSearchResult } from '@/types/shared.ts';

export function useUserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsersByEmail(query);
        setResults(users);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return { query, setQuery, results, loading };
}
