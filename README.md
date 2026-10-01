# New Haven Community Events Lending Library

A lending library for the gear that makes gatherings happen: folding tables, chairs, a PA, pop-up tents, string lights, an ADA ramp. The Civic Works Department and GROUP PROJECT keep it in New Haven. Hosts put together a request list, one of the librarians writes back, pickup happens in person at GROUP PROJECT, and after the gear comes back the host leaves a tip. That tip becomes part of the item's public biography.

## What's in this version

- **The library** (home): all 13 starter items grouped by category. Each shows how many are available and the latest tip from a past host.
- **Item pages**: description, care notes, availability, and the biography (dated tips from past borrowers, newest first).
- **Request list**: add several items, adjust quantities, then send one short form. Submitting creates one request group with one line per item.
- **Confirmation**: pickup details, plus the most recent tip for anything you requested.
- **Librarians' desk** (`#/librarian`): requests grouped by submission, with Approve, Decline, Check out and Mark returned buttons for each item. Anything past its return date gets flagged. Once anything in a request comes back, the request gets one **Copy reflection link** button, and each returned item gets **Add a tip they told us** for tips a host says at the counter (posted only with their OK). The **Testimonials** tab is where librarians approve or hide testimonials that hosts marked OK to share. The Inventory tab syncs from a published Google Sheet CSV, with a preview before anything changes.
- **Reflection page** (`#/reflect/<token>`): one link per request. It asks one required question, "How did the gathering go?", with an "OK to share" checkbox that starts unchecked. Below that are optional tips for each returned item, collapsed until the host taps one. Tips go straight onto item biographies. Testimonials stay private to librarians unless the host checked "OK to share" **and** a librarian approved them. Older per-item links still open the single-item form.
- **What hosts say** (About page): shared, approved testimonials only. The section is hidden until there's at least one.
- **About**: how borrowing works and who keeps the library.

## Setup (Supabase)

With `SUPABASE_URL` and `SUPABASE_ANON_KEY` set (see `.env.example`), the app uses one shared database. Without them it runs on seeded preview data saved in this browser.

1. Run the files in `supabase/migrations/` in order, 0001 through 0005.
2. Authentication → Providers: turn on Email. Under URL Configuration, set Site URL to the address you use day to day. Add `https://<preview-host>/**` and `https://<published-host>/**` to Redirect URLs. The librarian sign-in page shows the exact line to paste.
3. Librarians are rows in `librarian_allowlist`. To add someone, run a new migration (or SQL) with `insert into public.librarian_allowlist (email, name) values ('them@example.com', 'Their name');`. Delete the row to remove them.

Hosts' contact details can be read only by signed-in librarians on the allowlist. The public can read the library and the biographies, and can call three functions: send a request, read a reflection prompt, and leave a reflection. Magic links only work in the same browser that asked for them.

## Editing the words

All public wording is in `src/content/copy.ts`, one named entry per piece of text. Rewrite any value freely, but keep the names. A value starting with `TODO` shows up as a dashed note on the page until you replace it.

## Inventory sheet columns

`name, slug, category, quantity_total, status, description, care_notes, replacement_cost, deposit`

`replacement_cost` and `deposit` are optional and take whole dollars ("$180", "180" and "180.00" all work). A blank cell clears the amount. If a sheet doesn't have one of these columns, the amounts already saved stay as they are. Both amounts are public. The replacement cost shows on the item page. The deposit shows on the item page, on the request list, on the confirmation page and on the librarians' request card. Each item has one deposit, however many someone borrows.

Category is one of: Furniture, Sound/AV, Lights/Power, Signage, Safety. Status is one of: active, repair, retired. The sync matches rows to items by slug, and anything missing from the sheet stays as it is. In Google Sheets: File → Share → Publish to web → CSV.

## Photos

Real photos only: a phone camera against a plain wall at GROUP PROJECT. No AI-generated images of items, people, or New Haven.

## Lineage

> Built by Kai in New Haven, with the Civic Works Department and GROUP PROJECT.
> Created from a build plan made at the Relational Tech Studio (https://studio.relationaltechproject.org).
> Remixed from Local Supplies Sharing — https://studio.relationaltechproject.org/library?item=dcb4d804-a256-4402-b785-00dabbf9635c
> Item-biography pattern drawn from the Z-Space community library shelf.

## Join the network

- [ ] Make repo public
- [ ] Add `relational-tech` topic (`gh repo edit <owner>/<repo> --add-topic relational-tech`, or gear icon next to "About" in the GitHub UI)
- [ ] Add MIT license
- [ ] Commit `.reltech.yml`

The RTP Watcher finds public repos with the `relational-tech` topic so other neighborhoods can find this work and remix it.

## License

MIT. See `LICENSE`.