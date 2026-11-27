# Odgadnij Flagę — projekt Android / Google Play

Kompletna gra offline zapakowana do aplikacji Android. Projekt jest niezależny od GitHub Pages; publikacja zmian tutaj nie zmienia strony internetowej.

**Zacznij od [instrukcji Google Play](docs/GOOGLE-PLAY.md).**

## Pliki

- `../index.html` (repozytorium) lub `game-source/index.html` (paczka ZIP): aktualna gra z dołączonymi grafikami. Gradle automatycznie przygotowuje zasoby aplikacji.
- `MainActivity.java`: bezpieczny lokalny host, przycisk Wstecz i cykl życia Androida.
- `docs/`: instrukcja podpisania AAB, roboczy opis sklepu i polityka prywatności.
- `keystore.properties.example`: przykład konfiguracji własnego klucza, bez sekretów.

## Budowanie

Android Studio: otwórz ten katalog. Projekt zawiera Gradle Wrapper.

Terminal (SDK 36 i JDK 17+):

```sh
./gradlew :app:assembleDebug :app:bundleRelease :app:lintRelease
```

Bez własnego klucza release AAB pozostaje **niepodpisany**. APK debug jest wyłącznie do testów. Klucz testowy powstaje automatycznie w `.local/debug.keystore` przy pierwszej kompilacji; nie jest dołączany do projektu.

Przed publikacją przetestuj aplikację na rzeczywistym telefonie i podpisz AAB własnym kluczem przesyłania.

GitHub Actions automatycznie tworzy testowy APK, niepodpisany AAB i projekt ZIP w wydaniu przedpremierowym. Nie publikuje aplikacji w Google Play i nie używa klucza produkcyjnego.
