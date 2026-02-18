import { useState, useEffect } from 'react';
import { searchUsersByNickname } from '@/services/sharedService.ts';
import { getMyContacts } from '@/services/contactsService.ts';
import type { UserSearchResult } from '@/types/shared.ts';

export function useUserSearch() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<UserSearchResult[]>([]);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved contacts on mount
  useEffect(() => {
    getMyContacts()
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  // Search by nickname when query >= 2 chars
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsersByNickname(query);
        setResults(users);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return { query, setQuery, contacts, results, loading };
}
