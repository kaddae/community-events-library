// All public wording lives here, one named block per piece of text.
// Rewrite any value freely — pages look blocks up by name, so keep the names.
// A value starting with "TODO" renders as a dashed note until you replace it.

// The pickup address, used in the footer, the borrowing steps, and every email.
const STREET = '140 Bradley Street';
const ADDRESS = `${STREET}, New Haven CT 06511`;
// Where hosts can chip in online. Used on the request form, the confirmation page and the request email.
const VENMO_URL = 'https://www.venmo.com/u/groupprojectnhv';
// Open hours for pickup and drop-off. day: 0 = Sunday … 6 = Saturday. Times are 24-hour.
// Change hours here and the request form and "How borrowing works" both follow.
const OPEN_HOURS = [
  { day: 1, from: '16:00', to: '19:00' },
  { day: 2, from: '15:00', to: '18:00' },
  { day: 4, from: '16:00', to: '19:00' },
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hourShort = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
};
// "Mon 4–7 pm, Tue 3–6 pm, Thu 4–7 pm"
const HOURS = OPEN_HOURS
  .map((o) => `${DAY_NAMES[o.day]} ${hourShort(o.from)}–${hourShort(o.to)} ${Number(o.to.split(':')[0]) >= 12 ? 'pm' : 'am'}`)
  .join(', ');

export const copy = {
  shared: {
    siteName: 'Community Events Lending Library',
    placeLine: 'New Haven · GROUP PROJECT x Civic Works',
    // The header line under the site name. Each partner name links to its website.
    placeCity: 'New Haven',
    groupProject: { name: 'GROUP PROJECT', url: 'https://groupproject.group' },
    civicWorks: { name: 'Civic Works', url: 'https://www.civicworksct.org/' },
    address: `GROUP PROJECT · ${ADDRESS}`,
    supportedBy: 'The library is supported by GROUP PROJECT and Civic Works.',
    librarianEmail: 'groupprojectnhv@gmail.com',
    venmo: { label: '@groupprojectnhv', url: VENMO_URL },
    photoComingSoon: 'Photo coming soon',
  },
  home: {
    who: 'Welcome to the Community Events Lending Library, hosted by GROUP PROJECT and Civic Works!',
    emptyShelf: 'The library is empty right now. The librarians are restocking.',
    itemsTitle: 'Borrow individual items',
    itemsHint: 'Mix and match the items you need for your gathering.',
    // {count} is every item the library owns, out or not.
    countLine: '{count} items in the library',
    filterLabel: 'Show a category',
  },
  // Gathering kits on the Library page. Counts come from the sheet's block_party
  // and indoor_gathering columns.
  kits: {
    title: 'Start with a bundle',
    hint: 'Hosting a block party or community meeting? Start with these pre-selected item bundles. You can still customize your selection after starting here.',
    blockParty: { title: 'Block Party Bundle', picker: 'Block party' },
    indoorGathering: { title: 'Community Meeting Bundle', picker: 'Community meeting' },
    everything: 'Everything',
    start: 'Start with this bundle',
    none: 'Nothing in this bundle can go out right now. Write the librarians and we’ll figure something out.',
  },
  item: {
    requestAnyway: 'Request anyway',
    // On the grayed-out button when the library has 0 of an item.
    comingSoon: 'Coming soon',
    // The count line on each card: total first, today's count after it in smaller text.
    cardTotal: '{total} in the library',
    cardToday: '{count} available today',
    biographyTitle: 'Biography',
    biographyEmpty: 'No stories yet. The first host to borrow this can add to the history of this item.',
    careNotesTitle: 'Care notes',
    // {amount} is filled in from the Google Sheet. Each line shows only when that item has an amount.
    deposit: '{amount} deposit at pickup, returned in full when it comes back in good shape.',
    replacementCost: 'About {amount} to replace if it’s lost or broken.',
  },
  request: {
    title: 'Your request list',
    empty: 'Nothing on your list yet. Add what your gathering needs from the library.',
    formTitle: 'About your gathering',
    openHours: OPEN_HOURS,
    slotMinutes: 30,
    pickupTitle: 'Pickup day and time',
    pickupHint: 'Pick the day you’d like to pick up and your ideal time. A librarian will confirm by email.',
    pickupNeedDate: 'Pick the date of your gathering first. Pickup days will show up here.',
    pickupNone: 'The library isn’t open again before your gathering. Tell us a time that could work, and we’ll sort it out by email.',
    pickupNoneLabel: 'A time that could work for pickup',
    pickupDayLabel: 'Pickup day',
    pickupTimeLabel: 'Ideal time',
    pickupPick: 'Pick a pickup day.',
    timePick: 'Pick an ideal time.',
    // Saved with the request and shown to librarians after the pickup day. {time} is like "4:30 pm".
    idealTime: 'ideally {time}',
    pickupNoneNeeded: 'Tell us a time that could work for pickup.',
    returnTitle: 'Drop-off day',
    returnHint: 'Bring everything back during open hours on the day you pick.',
    returnNeedDate: 'Pick the date of your gathering first. Drop-off days will show up here.',
    returnPick: 'Pick a day to bring things back.',
    descriptionLabel: 'Share more about your gathering.',
    heardFromLabel: 'How did you hear about the lending library?',
    submit: 'Send request to the librarians',
    responseTime: 'We will respond to you in the next 2 business days!',
    sentTitle: 'Request sent.',
    sentBody: `We'll reach out to set up pickup at GROUP PROJECT (${ADDRESS}). You can put down a deposit (if needed) and sign the borrower agreement in person.`,
    careAgreement: 'We ask you to treat the items you borrow carefully, and let us know if anything happens. If an item is lost or seriously damaged, we may ask you to pay for the replacement or repair.',
    handoffLead: 'A note from the last host',
    outNow: '{count} out with another gathering right now',
    outNote: 'Some of this is out with another gathering right now. The librarians will check whether it’s back in time for your dates.',
    depositLead: 'Deposit due at pickup:',
    depositReturn: 'Returned in full when everything comes back in good shape.',
    privacy: 'Only the GROUP PROJECT librarians see your email and phone, and only for lending library business.',
    emailFailed: 'Your request was sent, but for some reason the email didn’t go out. Please write to {email} so we can find a time for pickup.',
    // Chip-in ask at the end of the request form. Money changes hands at pickup.
    chipInTitle: 'Chip in for the library?',
    chipInLead: 'Borrowing is free. If you can, chip in toward keeping things stocked and repaired. $10–20 is typical, and any amount helps.',
    chipInWhyTitle: 'Why chip in?',
    chipInWhy: 'Managing this library requires time, energy, and money for operating costs like insurance and rent. We are committed to keeping the library accessible to as many people as possible, and do not require anyone to pay a certain amount to use the library. We do ask that you deeply consider paying $10–20 for your use of the library, to help sustain this resource for all.',
    chipInAmounts: [10, 15, 20],
    chipInOther: 'Other amount',
    chipInOtherLabel: 'Amount in dollars',
    chipInNone: 'Not this time',
    chipInPick: 'Pick an amount to chip in, or “Not this time”.',
    chipInOtherError: 'Type a whole-dollar amount, like 25.',
    // Shows once an amount is picked. {venmo} becomes a link to the library's Venmo.
    chipInPay: 'You can pay online on Venmo at {venmo}, or in person when you pick up your items.',
    pledgeThanks: 'You offered {amount} toward the library. Thank you! You can pay online on Venmo at {venmo}, or in person (cash or Venmo) when you pick up, alongside any deposit.',
    venmoButton: 'Chip in on Venmo',
    venmoNote: 'Put “{eventName}” in the Venmo note so the librarians can match it to your request.',
  },
  reflect: {
    title: 'Leave a tip for the next host',
    tipLabel: 'One tip for the next organizer',
    howLabel: 'One line about how it went',
    submit: 'Add to the biography',
    thanks: 'Thank you — your note is now part of this item’s story.',
    groupTitle: 'How did it go?',
    gatheringLabel: 'How did the gathering go?',
    shareLabel: 'OK to share this publicly with my first name',
    shareHint: 'If you leave this unchecked, only the GROUP PROJECT librarians will read it.',
    tipsTitle: 'Got a tip for any of these?',
    tipsHint: 'Optional. Tap an item to leave a tip for the next host who borrows it.',
    tipPlaceholder: 'What should the next host know?',
    groupSubmit: 'Send to the librarians',
    groupThanks: 'Thank you. The librarians read every one of these.',
  },
  desk: {
    tipButton: 'Add a tip they told us',
    tipLabel: 'Their tip, in their words',
    consentLabel: 'They said it’s OK to post this with their first name.',
    testimonialsEmpty: 'No testimonials yet. They come in when a host fills out their reflection link.',
    depositFlag: 'Deposit at pickup:',
    pledgeFlag: 'Toward the library:',
    pledgeNone: 'Not this time',
    heardFromFlag: 'Heard about us:',
    // Under a waiting line that asks for more than is in the library now.
    holder: '{qty} {state} with the {eventName}, back {returnBy}',
    holderWhen: {
      before: 'before this pickup ({pickup})',
      same: 'same day as this pickup ({pickup})',
      after: 'after this pickup ({pickup})',
    },
    emails: {
      title: 'Emails',
      checkout: 'Checkout email',
      returned: 'Return thank-you',
      late: 'Check in about the late return',
      sent: {
        checkout: 'Checkout email sent {date}',
        returned: 'Thank-you sent {date}',
        late: 'Late check-in sent {date}',
      },
      copyLink: 'Copy link instead',
      linkCopied: 'Link copied',
      send: 'Send to {firstName} and the library inbox',
    },
  },
  // Emails. Every one goes to the host and threadAddress. Reply goes to threadAddress.
  // Slots in {braces} are filled in for each request. Keep the slot names.
  email: {
    threadAddress: 'groupprojectnhv@gmail.com',
    // The same subject on every email keeps each request in one Gmail thread.
    subject: 'Lending library request: {eventName} ({eventDate})',
    pickupAddress: `GROUP PROJECT, ${ADDRESS}`,
    depositLine: 'Deposit due at pickup: {deposits}. It’s returned in full when everything comes back in good shape.',
    outNow: ' ({count} out with another gathering right now. We’ll check it’s back in time.)',
    depositHeld: 'Deposit held: {deposits}. It’s returned in full when everything comes back in good shape.',
    pledgeLine: `You offered {amount} toward the library. Thank you! You can pay online on Venmo (${VENMO_URL}) or in person at pickup, alongside any deposit.`,
    signoff: '— The Community Events Lending Library\nGROUP PROJECT x Civic Works',
    policy: 'Events lending library - borrower agreement\nhttps://docs.google.com/document/d/1_nlWbO_1eAYxsQYAw-lKWgtMN9jd556UkXwyKaDvvbY/edit',
    request: `Hi {firstName},

Thanks for your request for the {eventName}! Here's what you asked for:

{items}

Gathering: {eventDate}
Pickup day and ideal time: {neededFrom}{pickupWindow}
Bring back by: {returnBy}

Your pickup isn't confirmed yet. Please wait to hear back from a librarian before coming by.

{deposit}

{pledge}

Pickup is at {pickupAddress}.

We will respond to you in the next 2 business days! Reply to this email with any questions. Replies reach both you and the librarians.

{signoff}`,
    checkout: `Hi {firstName},

You're all set for the {eventName}. Here's what you took home:

{items}

Please bring everything back to {pickupAddress} by {returnBy}.

{deposit}

Our borrowing policy:
{policy}

If anything breaks or you need more time, just reply here. We'd much rather hear about it early.

{signoff}`,
    returned: `Hi {firstName},

Everything from the {eventName} is back. Thank you for taking good care of it.

Would you take two minutes to tell us how the gathering went? You can also leave a tip for the next event host who borrows the same gear:
{reflectionLink}

{signoff}`,
    late: `Hi {firstName},

Just checking in about the gear from the {eventName}. We had it down to come back {returnBy}, and these are still out:

{items}

No worries if plans changed. Reply and let us know how it's going and when works to bring it by {pickupAddress}. If something broke or went missing, tell us. We'd rather figure it out together.

{signoff}`,
  },
  // The About page's sections live in src/content/about.ts (markdown).
  about: {
    title: 'All about the library',
    testimonialsTitle: 'What hosts say',
    howTitle: 'How borrowing works',
    borrow: `Browse our catalog and pick out what you need. Request your items, find a time to pick up at GROUP PROJECT (${STREET}) during open hours (${HOURS}), and have a great event!`,
    giveBack: 'After your gathering, bring your items back to GROUP PROJECT, and let us know how it went!',
  },
};
