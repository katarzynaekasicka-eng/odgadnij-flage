# Weryfikacja przygotowanej wersji

Źródło gry: `7e71eb8281f04d027b449b54b2ba289acf3e9715`.

Sprawdzone podczas przygotowania:

- `assembleDebug`, `bundleRelease`, `lintRelease` — kompilacja zakończona sukcesem, brak błędów Lint.
- Podpis APK debug zweryfikowany przez `apksigner` (schemat v2).
- Pakiet testowy `.debug`, min SDK 26, target SDK 36.
- Brak uprawnień INTERNET, lokalizacji, kamery, mikrofonu i współdzielonej pamięci. AndroidX dodaje wyłącznie wewnętrzne uprawnienie odbiornika o ochronie signature.
- Brak bibliotek natywnych `.so` w APK i AAB.
- Zasoby gry dołączone do APK/AAB, odpowiedzi bez miniatur flag.
- Testy JS zapakowanej strony: systemowe Wstecz, potwierdzenie powrotu, anulowanie, komunikat odpowiedzi, poprawne punkty, 30 sekund pauzy po minimalizacji i wznowienie.
- ZIP projektu sprawdzony pod kątem integralności i braku plików kluczy, haseł oraz konfiguracji lokalnego SDK.

Nie wykonano jeszcze testu na fizycznym telefonie ani pełnego uruchomienia w emulatorze Android. To kolejny krok przed podpisaniem wersji sklepowej. Test w przeglądarce nie zastępuje testu Android WebView na urządzeniu.

Pozostałe ostrzeżenia Lint dotyczą zgodności atrybutu wstecz z API 33, nowszej dostępnej wersji Gradle i sprawdzania wariantu ikony. Projekt ma osobny wariant ikony monochromatycznej dla API 33+. Nie użyto baseline do ukrywania błędów.
