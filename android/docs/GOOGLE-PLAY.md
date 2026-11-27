# Przygotowanie publikacji — Odgadnij Flagę

Projekt używa Android SDK 36 (Android 16), min SDK 26 (Android 8.0), Gradle 8.13, AGP 8.13.2 i JDK 17. Aktualne źródło gry: commit `7e71eb8281f04d027b449b54b2ba289acf3e9715` w repozytorium `katarzynaekasicka-eng/odgadnij-flage`. Zmiany w aplikacji internetowej nie zmieniają automatycznie zainstalowanego APK: po zmianach trzeba wydać kolejną wersję Android.

## Tożsamość aplikacji

- Nazwa: **Odgadnij Flagę**
- Identyfikator: `pl.katarzynaekasicka.odgadnijflage`
- Pierwsza wersja: `1.0.0` (`versionCode` 1)
- Pakiet testowy ma sufiks `.debug`, aby nie zastępował aplikacji sklepowej.

Identyfikator jest propozycją na pierwszą publikację. Można go zmienić w `app/build.gradle` przed pierwszym wgraniem do Play Console. Po pierwszej publikacji trzeba używać tego samego identyfikatora i zwiększać `versionCode`.

## Otwórz projekt

1. Zainstaluj Android Studio ze strony https://developer.android.com/studio.
2. Rozpakuj projekt i wybierz **Open** → folder zawierający `settings.gradle`.
3. Pozwól Android Studio pobrać SDK 36 i zsynchronizować Gradle. Użyj JDK 17 lub nowszego zgodnego z AGP (Android Studio dostarcza JDK).
4. Do testu użyj **Run**, telefonu z debugowaniem USB lub emulatora. Gradle może utworzyć standardowy lokalny klucz testowy; nigdy nie używaj go do publikacji.

## Testy na telefonie przed publikacją

Sprawdź uruchomienie bez internetu, 195 flag, odpowiedzi zawierające wyłącznie nazwy państw, dźwięk, życie i punkty. Zminimalizuj grę na 30 sekund: timer musi pozostać zatrzymany. Sprawdź klawiaturę przy wpisywaniu nicku, obrót, przyciski systemowe, duży rozmiar tekstu i nawigację gestami. Sprawdź co najmniej Androida 8/9 oraz aktualnego Androida 16. Nie traktuj samej kompilacji jako testu na urządzeniu.

## Podpisany plik do Google Play

Plik AAB z etykietą **unsigned** nie jest jeszcze gotowy do wgrania do sklepu.

1. W Android Studio wybierz **Build → Generate Signed App Bundle / APK → Android App Bundle**.
2. Wybierz moduł **app** i utwórz własny klucz **upload key** albo wskaż posiadany klucz.
3. Zapisz klucz i hasła w bezpiecznym miejscu oraz wykonaj kopię zapasową. Nie wysyłaj klucza ani haseł w czacie i nie dodawaj ich do GitHuba.
4. Wybierz wariant **release** i wygeneruj podpisany AAB.
5. Dopiero ten podpisany plik będzie służył do testów w Google Play Console. Sklep sprawdza również treść, polityki i jakość aplikacji; poprawna kompilacja nie gwarantuje akceptacji.

Opcjonalna kompilacja w terminalu: skopiuj `keystore.properties.example` do `keystore.properties`, uzupełnij lokalnie dane własnego klucza i uruchom `./gradlew :app:bundleRelease`. Rzeczywisty plik i klucze są wykluczone przez `.gitignore`.

## Formularze sklepu — fakty z tej wersji

- Aplikacja jest grą offline. Brak reklam, zakupów, logowania i analityki.
- Brak uprawnień Internet, aparatu, lokalizacji, kontaktów i pamięci współdzielonej.
- Wyniki i ustawienia przechowywane są lokalnie. Dane gry nie są wysyłane na serwer.
- Uzupełnij własne dane kontaktowe, docelowy wiek odbiorców i kwestionariusz klasyfikacji treści zgodnie ze stanem faktycznym.
- Projekt zawiera szkic polityki prywatności. Uzupełnij i sprawdź dane wydawcy przed publikacją pod publicznym adresem.
- Dla nowych kont osobistych mogą być wymagane testy zamknięte przed dostępem do produkcji. Sprawdź wymagania pokazane w swoim Play Console.

## Ważne ograniczenie

Przy wymuszonej przez system likwidacji procesu niezakończona rozgrywka może się zresetować. Zapisane rekordy i ustawienia pozostają na urządzeniu. Odinstalowanie aplikacji usuwa dane lokalne.
