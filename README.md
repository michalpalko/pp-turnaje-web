# Staticky web pre futbalove turnaje

Toto je jednoduchsi prototyp bez databazy a bez admin systemu.

Web ma:

- prezentacnu hlavnu stranku
- historiu turnajov
- jednu univerzalnu detail stranku pre turnaj
- fotogaleriu k turnaju
- data ulozene v `data/turnaje.json`

## Spustenie

python3 -m http.server 4174

Potom otvorit:

```text
http://localhost:4174
```

## Ako sa prida novy historicky turnaj bez databazy


## Plagaty nadchadzajucich turnajov


## Dolezite

## Firebase (Firestore + Storage)

Projekt je pripraveny aj na nacitavanie turnajov z Firebase Firestore
(s fotkami v Firebase Storage) namiesto lokalneho `data/turnaje.json`.
Kym nie je Firebase zapnuty (`firebase-config.js` → `FIREBASE_ENABLED`),
web funguje presne ako doteraz z lokalneho suboru. Cely postup nastavenia
Firebase projektu, datovy model turnaja a pravidla pre Historia/Nadchadzajuce
su v [`FIREBASE-SETUP.md`](FIREBASE-SETUP.md).
