# Snapdeal Virtual KAM: voice prototype

**Live demo:** https://snapdeal-virtual-kam-27f429.netlify.app (Chrome or Edge, with headphones; no login or key needed)
**Demo video (2 min):** https://youtu.be/HdR3dIUvCj0

A voice agent that works as a seller's key account manager inside a seller-panel prototype. A seller whose sales dropped talks to it in Hindi, Hinglish or English. The agent finds the cause from the account data, confirms it with the seller, makes the changes the seller agrees to, calls back at the agreed time knowing what was promised, and files a report for the human KAM team.

## What it does

- **Voice conversation.** Gemini 3.8 Live listens and speaks natively, so the seller can interrupt mid-sentence. The agent follows the seller between English, Hinglish and Hindi and speaks with an Indian accent. A call-language picker sets how it opens.
- **Diagnosis from data.** Three mock sellers lost sales for different reasons. The agent gets the same instructions and tools for each and has to find the cause itself:

  | Seller | What the numbers show | Actual cause |
  | --- | --- | --- |
  | Gupta Home & Kitchen (data from the brief) | Orders down, cancellations and stock-outs up | Stock ran out, and 7 listings kept showing stock the seller didn't have |
  | Sharma Ethnic Wear | Orders down, price unchanged, fewer visitors buying | New competitors selling similar kurtis 20 to 30% cheaper |
  | Raza Mobile Accessories | Orders down, impressions down 42% | Ads paused when the balance ran out, and 15 products hidden from search |

- **Reasoning on screen.** A board lists four possible causes and the agent marks each one suspected, confirmed or ruled out as it checks the data and asks the seller what only they know.
- **Actions with consent.** Correcting stock counts, restock plans for the products the seller names, low-stock alerts, price changes within the seller's margin, sale events, fixing hidden listings, restarting ads, follow-up calls and escalation to a human. Each action shows its expected rupee impact.
- **Memory.** Every call is saved in the browser. The next call happens when the seller asked for it ("kal shaam" is the next day, "3 din" is three days), with simulated results of what was agreed, so the agent checks progress and chases what is stuck. It remembers the seller's margin, the price cuts already live and which products are back in stock.
- **Handover.** After each call the seller gets a WhatsApp summary, and the KAM team gets a call report (diagnosis, actions, seller commitments, concerns, mood, risks, next step) with a downloadable transcript.

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

Code does the maths and the model does the conversation. An analytics engine in plain JavaScript computes every change, sizes each fix in rupees and simulates follow-up results, so the numbers the agent says are the numbers on screen. Amounts reach the model already written out in words.

## Rules enforced in code

Test calls showed the model sometimes broke its instructions, so the rules that matter are checked in code:

1. **Consent.** If the agent tries to change the account before the seller has answered its question, the action is held without a reply, so the model stays quiet. When the seller answers, the model gets their exact words and decides.
2. **Evidence first.** A cause can be confirmed or ruled out only after the tool that checks it has run.
3. **No loss-making advice.** Price cuts and sale discounts need the seller's margin, are added up per product, and anything leaving less than 2% profit is refused. A new cut on a product replaces the earlier one.
4. **Only confirmed actions.** The agent may only claim what a tool confirmed. Restock plans contain exactly the products named, and actions that don't fit the seller are refused.
5. **Closing checklist.** The WhatsApp summary waits until all four causes are marked, and hanging up waits until the summary and the call report are done.
6. **Language.** English calls get English-only instructions, and the page reminds the model if Hindi creeps in while the seller is speaking English.
7. **Dropped connections.** The page reconnects within a couple of seconds using Gemini's session resumption, or replays the conversation if that fails, and logs the reason for each drop.

## Files

```
index.html                  the whole app: seller panel, audio, Gemini Live connection, tools, analytics, memory, reports
netlify/functions/token.mjs mints short-lived Gemini tokens so the API key never reaches the browser
netlify.toml                tells Netlify where the site and the function are
```

There is no build step and no npm package.

## Run it yourself

You need a Gemini API key from https://aistudio.google.com.

**Locally:** open `index.html` in Chrome, open Settings, paste your key and press "Call the KAM". Use headphones.

**Deployed (a link that needs no key):** put these files in a GitHub repository, import it into Netlify (or deploy with the Netlify CLI), add the environment variable `GEMINI_API_KEY`, and deploy.

## Known limits

- All seller data and actions are mock, and follow-up results are simulated.
- Use Chrome or Edge. Firefox can't run the microphone at 16 kHz the way this page asks.
- Without headphones the agent can hear itself, and background noise is sometimes transcribed as words in other languages.
- Call history lives in the browser, so each visitor starts fresh. "Call history" has a button to clear it.
- The public demo has no per-user rate limit.

## Next steps

Connect the tools to real seller-panel data, put the same agent behind a phone number through a telephony provider, let monitoring start outbound calls before sales fall, send follow-ups on WhatsApp, and save call reports to the KAM team's CRM.
