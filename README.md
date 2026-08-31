# Statický web pre futbalové turnaje

Prezentačný web pre mládežnícke futbalové turnaje. Statická stránka (HTML/CSS/JS bez buildu), obsah sa načíta z Firebase.

Web má:

- prezentačnú hlavnú stránku
- históriu turnajov a nadchádzajúce turnaje
- univerzálnu detail stránku pre turnaj s fotogalériou
- sekciu partnerov a sponzorov

## Dáta

Turnaje a sponzori sa načítavajú z Firebase (Firestore + Storage). Podrobný postup nastavenia je v [`FIREBASE-SETUP.md`](FIREBASE-SETUP.md).

## Spustenie lokálne

```bash
python3 -m http.server 4174
```

Potom otvoriť:

```text
http://localhost:4174
```
