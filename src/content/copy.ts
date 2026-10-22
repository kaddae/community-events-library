// All public wording lives here, one named block per piece of text.
// Rewrite any value freely — pages look blocks up by name, so keep the names.
// A value starting with "TODO" renders as a dashed note until you replace it.

export const copy = {
  shared: {
    siteName: 'Community Events Lending Library',
    placeLine: 'New Haven · GROUP PROJECT x Civic Works',
    supportedBy: 'The library is supported by GROUP PROJECT and Civic Works.',
    librarianEmail: 'groupprojectnhv@gmail.com',
    photoNeededShort: 'Photo needed — phone camera, plain wall at GROUP PROJECT',
    photoNeededFull: 'Add a real photo of this item — phone camera, plain wall at GROUP PROJECT is fine.',
  },
  home: {
    who: 'Welcome to the Event Lending Library, hosted by GROUP PROJECT and Civic Works! Find what you need to have a great event, borrow it, and have a great gathering! ',
    emptyShelf: 'The library is empty right now. The librarians are restocking.',
  },
  // Gathering kits on the Library page. Counts come from the sheet's block_party
  // and indoor_gathering columns.
  kits: {
    blockParty: { title: 'Block Party Bundle', picker: 'Block party' },
    indoorGathering: { title: 'Community Meeting Kit', picker: 'Community meeting' },
    everything: 'Everything',
    start: 'Start with this kit',
    none: 'Nothing in this kit can go out right now. Write the librarians and we’ll figure something out.',
  },
  item: {
    requestAnyway: 'Request anyway',
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
    submit: 'Send request to the librarians',
    responseTime: 'We will respond to you in the next 2 business days!',
    sentTitle: 'Request sent.',
    sentBody: "We'll reach out to set up pickup at GROUP PROJECT (140 Bradley Street, New Haven CT, 06511). You can put down a deposit (if needed) and sign the borrower agreement in person.",
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
    pledgeThanks: 'You offered {amount} toward the library. Thank you! Cash or Venmo at pickup, alongside any deposit.',
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
    pickupAddress: 'GROUP PROJECT, 140 Bradley Street, New Haven CT 06511',
    depositLine: 'Deposit due at pickup: {deposits}. It’s returned in full when everything comes back in good shape.',
    outNow: ' ({count} out with another gathering right now. We’ll check it’s back in time.)',
    depositHeld: 'Deposit held: {deposits}. It’s returned in full when everything comes back in good shape.',
    pledgeLine: 'You offered {amount} toward the library. Thank you! Cash or Venmo at pickup works, alongside any deposit.',
    signoff: '— The Community Events Lending Library\nGROUP PROJECT x Civic Works',
    policy: 'Events lending library - borrower agreement\nhttps://docs.google.com/document/d/1_nlWbO_1eAYxsQYAw-lKWgtMN9jd556UkXwyKaDvvbY/edit',
    request: `Hi {firstName},

Thanks for your request for the {eventName}! Here's what you asked for:

{items}

Gathering: {eventDate}
Pickup: {neededFrom}{pickupWindow}
Bring back by: {returnBy}

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
  about: {
    title: 'All about the library',
    testimonialsTitle: 'What hosts say',
    howTitle: 'How borrowing works',
    borrow: 'Browse our catalog and pick out what you need. Request your items, find a time to pick up at GROUP PROJECT, and have a great event!',
    giveBack: 'After your gathering, bring your item(s) back to GROUP PROJECT, and let us know how it went! We encourage you to share tips or tricks so that other event-hosts can learn from you.',
    cwd: 'Built by a growing coalition of neighbors, Civic Works\' mission is to increase volunteerism, civic engagement, and service in New Haven. We invest in neighbors to bring their blocks together because we believe that the health of our democracy begins at the neighborhood level. <br> Neighbors have often told us that a missing PA system, tables and chairs, or cleanup tools is often what stands between a great idea and an actual event. That\’s why we are so excited to partner with Group Project to build the Community Events Lending Library.',
    groupProject: 'GROUP PROJECT is a new hub for community-building that supports local projects through relationships, resources, and skill-sharing. We offer working space for projects, a lending library for gatherings, and partner with locals to host community-building events that inspire, educate, and help folks do cool stuff in New Haven. <br> We know from that hosting an event takes a lot of work, and can require organizers to coordinate the borrowing or buying of many different physical items. We built this library with the goal of encouraging more successful, impactful and joyous gatherings through easy access to the event materials and supplies they need.',
    getInvolved: 'Reach out to groupprojectnhv@gmail.com if you’d like to donate any items, or support the library in another way!',
  },
};
