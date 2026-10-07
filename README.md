# evsales.it

Sito one-page di Enea Vignocchi, consulente CRM per piccole aziende. HTML, CSS e JavaScript statici, senza build: si pubblica così com'è su Cloudflare Pages.

## Struttura

```
index.html            la pagina
privacy.html          privacy e cookie (bozza da far validare)
404.html
assets/css/site.css   stile (token in :root)
assets/js/site.js     interazioni + CONFIG in cima al file
assets/fonts/         Geist, servito dal sito (niente Google Fonts esterno, ok GDPR)
assets/img/           foto, og.png (anteprima link), apple-touch-icon
_redirects            link brevi per l'outbound
_headers              header di sicurezza e cache
PRODUCT.md            contesto di prodotto (usato dalla skill impeccable)
.claude/skills/       skill installate: impeccable, humanizer
```

## Prima di andare online

1. **Contratti**: verifica clausole di esclusiva con i ruoli attuali. Nella sezione "Chi sono" sono nominate Enginy.io, Aiclo e UpdateGroup.
2. **CONFIG** in `assets/js/site.js`:
   - `calLink`: l'evento Cal.com, es. `enea-vignocchi/45min` (crea un evento da 45 minuti con videochiamata).
   - `linkedin`: URL del profilo. Finché è vuoto, i link LinkedIn spariscono.
   - `piva`: Partita IVA (sostituisce "da inserire" nel footer).
   - `hubspot.portalId` / `formGuid` (facoltativo): le risposte del form finiscono anche in HubSpot.
3. **Privacy**: completa i campi tra `[ ]` in `privacy.html` e togli il riquadro "Bozza".
4. **Da confermare nel copy**: tempi tipici "tra 3 e 6 settimane" (FAQ) e "30 giorni di supporto" dopo la partenza.

## Pubblicare su Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → repo `evsales`.
2. Framework preset: **None**. Build command: vuoto. Output directory: `/`.
3. Custom domains → `evsales.it` (e `www.evsales.it` con redirect).

## Link per l'outbound

- `evsales.it/prenota` porta dritto al modulo (anche `/call` e `/45`).
- `evsales.it/?team=2-5#prenota` apre il modulo con la prima risposta già data.
- Si possono precompilare anche `nome`, `azienda`, `email`: `evsales.it/?nome=Mario%20Rossi&azienda=Rossi%20Srl#prenota`.

## Anteprima locale

```
npx http-server -p 8080 .
```
