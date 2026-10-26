import { useCallback, useState } from 'react';

/**
 * Hook two-way binding untuk elemen form.
 * Contoh: const [email, onEmailChange, setEmail] = useInput('');
 * Menerima event (input/textarea/select/checkbox) maupun nilai langsung.
 */
export default function useInput(defaultValue = '') {
  const [value, setValue] = useState(defaultValue);

  const onChange = useCallback((eventOrValue) => {
    if (eventOrValue && eventOrValue.target) {
      const { type, checked, value: v } = eventOrValue.target;
      setValue(type === 'checkbox' ? checked : v);
    } else {
      setValue(eventOrValue);
    }
  }, []);

  return [value, onChange, setValue];
}
