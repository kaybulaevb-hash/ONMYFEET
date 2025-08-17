import { useEffect, useRef } from "react";

/**
 * Дебаунс-запись в localStorage.
 * Пишет value по ключу key через delay мс после последнего изменения.
 * Ничего не возвращает — это побочный эффект.
 */
export default function useDebouncedLocalStorage(key, value, delay = 300) {
  const timerRef = useRef(null);

  useEffect(() => {
    // На этапе билда (Vercel) window/localStorage недоступны
    if (typeof window === "undefined") return;

    // Сбрасываем предыдущий таймер, если был
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, String(value ?? ""));
      } catch (_) {
        // Игнорируем ошибки квоты/инкогнито
      }
    }, delay);

    // Очистка при анмаунте/изменении зависимостей
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [key, value, delay]);
}
