import { useEffect, useRef, useState } from 'react';
import { searchFoods } from '../services/foods.js';

export function useFoodSearch() {
  const [state, setState] = useState({ status: 'idle', foods: [], term: '' });
  const active = useRef(null);
  useEffect(() => () => active.current?.abort(), []);

  async function search(query) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const term = query.trim();
    if (!term) {
      setState({ status: 'idle', foods: [], term: '' });
      return;
    }
    if (query.length > 100) {
      setState({ status: 'invalid', foods: [], term });
      return;
    }
    setState({ status: 'loading', foods: [], term });
    try {
      const foods = await searchFoods(term, { signal: controller.signal });
      if (!controller.signal.aborted) setState({ status: 'success', foods, term });
    } catch {
      if (!controller.signal.aborted) setState({ status: 'error', foods: [], term });
    }
  }

  return { ...state, search };
}
