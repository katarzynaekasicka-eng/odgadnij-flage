# Odgadnij Flagę

Polski quiz z 195 flagami państw. Trzy życia, 20 sekund na pytanie i 3 punkty za poprawną odpowiedź. Jedna zamiana flagi na grę. Wyniki i preferencje zapisują się na urządzeniu.

## Uruchomienie

- **GitHub Pages:** pliki z tej paczki umieść w głównym katalogu repozytorium; Settings → Pages → main → /(root).
- **Inny hosting:** wgraj zawartość paczki na dowolny hosting statyczny. Nie jest potrzebny build, npm ani serwer aplikacji.
- **Bez hostingu:** otwórz `index.html` z paczki ZIP w przeglądarce. Ten plik zawiera całą grę i grafikę.
- **Lokalny serwer:** `python -m http.server 3000`, następnie `http://localhost:3000`.

## Pliki wymagane na hostingu

`index.html`, `neon.css`, `game.js`, `assets.js`, `flags.js`, `manifest.webmanifest`, `service-worker.js` i `.nojekyll`.

`assets.js` i `flags.js` zawierają wszystkie flagi i grafikę startową. Nie ma osobnych katalogów do ręcznego przenoszenia. Wszystkie odnośniki działają również w podkatalogu, np. `/odgadnij-flage/`.

## Działanie offline i aktualizacje

Po pierwszym pełnym załadowaniu przez HTTPS service worker zachowuje kompletną grę. Nowa wersja sprawdza HTML w sieci i usuwa stare pamięci podręczne gry. Aktywna rozgrywka nie jest przerywana aktualizacją.

Timer uruchamia się dopiero po wczytaniu flagi, używa rzeczywistego upływu czasu i zatrzymuje się po ukryciu karty lub otwarciu potwierdzenia. Nieudane ładowanie grafiki nie odbiera życia.

## Zasoby i prywatność

Flagi: flagcdn.com, pakiet dołączony lokalnie (bardziej złożone flagi zapisano jako WebP). Grafika startowa pochodzi z dostarczonej paczki. Brak analityki, kont użytkowników i zewnętrznych żądań podczas gry. Ranking jest lokalny. Dane zapisuje przeglądarka, a blokada localStorage nie uniemożliwia rozgrywki.

## Paczka do pobrania

`Odgadnij_Flage_NEON.zip` zawiera samowystarczalny `index.html` i instrukcję. Można go otworzyć bezpośrednio w przeglądarce lub wgrać na inny hosting. Repozytorium zawiera uporządkowane źródła i wersję PWA dla GitHub Pages.
