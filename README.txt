ODGADNIJ FLAGĘ — NEON

Uruchomienie: wgraj całą zawartość ZIP na hosting statyczny, np. Netlify.
Lokalnie: python -m http.server 8000 i otwórz http://localhost:8000.

Zmieniono wygląd menu, quizu i nakładki odpowiedzi według przesłanej grafiki.
Zachowano 195 państw, 20 sekund, 3 punkty, 3 życia, ranking lokalny i ustawienia.
Flagi SVG i WebP dołączono do paczki (źródło: flagcdn.com); po pierwszym pełnym
załadowaniu aplikacja działa offline. Zaktualizowano pamięć service workera.
Ranking i ustawienia pozostają na urządzeniu.

Weryfikacja: poprawna/błędna odpowiedź, kolejne pytanie, reset, zamiana flagi,
tryb offline i szerokości 320, 360, 390 oraz 768 px.
