# Snapdeal Virtual KAM — voice prototype

A Virtual Key Account Manager inside a seller-panel prototype. A seller whose sales dropped talks to it in Hindi, Hinglish or English. The KAM diagnoses the cause from the account data, confirms it with the seller, takes agreed actions on their behalf, remembers the call, follows up a week later, and files a report for the human KAM team.

## What it does

- **Voice-first conversation** with Gemini 3.8 Live, which listens and speaks natively. The seller can interrupt, and the KAM follows the seller's language. A call-language picker sets how it opens (Hinglish by default).
- **Diagnoses instead of following a script.** Three mock sellers have different root causes. The KAM gets the same instructions and tools for each, and must find the cause itself:

  | Seller | What the numbers show | Real cause |
  | --- | --- | --- |
  | Gupta Home & Kitchen (brief data) | Orders down, cancellations and stock-outs up | Stock ran out, and 7 listings kept showing stock the seller didn't have |
  | Sharma Ethnic Wear | Orders down, price unchanged, fewer visitors buying | New competitors selling similar kurtis 20–30% cheaper |
  | Raza Mobile Accessories | Orders down, impressions down 42% | Ads paused when the balance ran out, and 15 products hidden from search |

- **Shows its reasoning live.** The "What's causing the drop" board marks each of four causes as suspected, confirmed or ruled out as the KAM investigates.
- **Takes action with consent:** fix wrong stock, restock plans, low-stock alerts, price changes, sale events, fixing hidden products, restarting ads, follow-up calls, escalation to a human. Each action shows its rupee impact.
- **Remembers.** Every call is saved in the browser. The next call with that seller is simulated at the follow-up time agreed (for example "kal shaam" means the next day; otherwise a week later), with results based on what was agreed (for example, 4 of 5 products restocked but one supplier didn't deliver), so the KAM checks progress and chases what's stuck.
- **Hands over to humans.** After each call: a WhatsApp summary for the seller, and a call report for the KAM team (diagnosis, actions, seller commitments, concerns, mood, risks, next best action), with a downloadable transcript.

## How it works

```
Browser (index.html)                       Netlify function            Google
1. "Call the KAM"
2. POST /api/token  ───────────────────▶  uses GEMINI_API_KEY  ─────▶ 1-use, 30-min token
3. WebSocket to Gemini Live with token ──────────────────────────────▶ gemini-3.8-live
4. Mic audio (16 kHz PCM) ───────────────────────────────────────────▶ hears the seller
5.                    ◀────────────────── spoken reply (24 kHz PCM) + live transcript
6.                    ◀────────────────── tool call, e.g. get_price_comparison
7. Runs the tool on mock data, updates the screen, returns the result ▶ keeps talking
```

**Division of labour.** Plain code does the maths: an analytics engine computes every change, sizes each fix in rupees, and simulates follow-up results. The model does the conversation, the questioning and the judgment. Amounts reach the model already written in Hindi and English words, so it never garbles a number.

**Rules enforced in code, not just in the prompt.** Real test calls showed the model sometimes broke instructions (acting before the seller agreed, claiming actions it never took, or suggesting a price cut bigger than the seller's margin), so these rules are checked in code:

1. **Consent:** if the KAM tries to change the seller's account before the seller has answered its question, the action is held silently: the tool call stays unanswered, so the model has nothing to react to and stays quiet. When the seller replies, the model receives their exact words and decides whether to act. (An earlier version replied "not done, wait", which made the model repeat its question.)
2. **Closing checklist:** the WhatsApp summary is refused until all four causes are marked, and hanging up is refused until the summary and the call report are done.
3. **Fit:** actions that don't apply to this seller (for example, cutting prices when they are already competitive) are refused.
4. **No loss-making advice:** price cuts and sale discounts need the seller's margin, and the code adds them up per product, refusing anything that leaves less than 2 points of profit. If that isn't enough to match competitors, the tool says so and the KAM suggests other ways to compete.

## Files

```
index.html                  the whole app: seller panel, audio, Gemini Live connection, tools, analytics, memory, reports
netlify/functions/token.mjs mints short-lived Gemini tokens so the API key never reaches the browser
netlify.toml                tells Netlify where the site and the function are
```

No build step and no npm packages.

## Run it

You need a Gemini API key from https://aistudio.google.com.

**Local test:** open `index.html` in Chrome, open Settings, paste your key, and press "Call the KAM". Use headphones.

**Deploy (a shareable link that needs no key):**

1. Create a public GitHub repository and upload these files, keeping the `netlify/functions` folder.
2. In Netlify, import the repository from GitHub.
3. Add the environment variable `GEMINI_API_KEY`, then deploy.
4. Open the Netlify link in Chrome and allow the microphone.

## Known limits

- Use Chrome or Edge. Firefox can't run the microphone at 16 kHz the way this page asks.
- Without headphones, the KAM can hear itself and stop mid-sentence.
- Call history lives in the browser's local storage, so each evaluator starts fresh. "Call history" has a button to clear it.
- Anyone with the deployed link can start calls on your key. The server only issues tokens to its own pages, but there is no per-user rate limit.
- Next step beyond this prototype: put the same agent behind a phone number through a telephony partner, and connect the tools to real seller-panel data.
