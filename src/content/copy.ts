// All public wording lives here, one named block per piece of text.
// Rewrite any value freely — pages look blocks up by name, so keep the names.
// A value starting with "TODO" renders as a dashed note until you replace it.

export const copy = {
  shared: {
    siteName: 'Community Events Lending Library',
    placeLine: 'New Haven · GROUP PROJECT x Civic Works Department',
    supportedBy: 'The library is supported by GROUP PROJECT and the Civic Works Department.',
    librarianEmail: 'grouprojectnhv@gmail.com',
    photoNeededShort: 'Photo needed — phone camera, plain wall at GROUP PROJECT',
    photoNeededFull: 'Add a real photo of this item — phone camera, plain wall at GROUP PROJECT is fine.',
  },
  home: {
    who: 'TODO: one line in your own voice — who is behind the library (CWD + GROUP PROJECT), the way you would say it to a friend at a New Haven potluck.',
    emptyShelf: 'The library is empty right now. The librarians are restocking.',
  },
  item: {
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
    sentBody: "We'll reach out to set up pickup at GROUP PROJECT (140 Bradley Street, New Haven CT, 06511). You can put down a deposit and sign the care agreement in person.",
    careAgreement: 'TODO: librarians — add a one-line summary of the care agreement and the small fee amount.',
    handoffLead: 'A note from the last host',
    depositLead: 'Deposit due at pickup:',
    depositReturn: 'Returned in full when everything comes back in good shape.',
    privacy: 'TODO: in your own words, say who sees a host’s contact info — e.g. only the GROUP PROJECT librarians see your email and phone, and only to set up pickup.',
    emailFailed: 'Your request is saved, but the email didn’t go out. Write {email} so we can start the conversation.',
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
      policyTodo: 'The policy in this email is still a placeholder. Replace the TODO line here (or in copy.ts, for every email) before sending.',
      send: 'Send to {firstName} and the library inbox',
    },
  },
  // Emails. Every one goes to the host and threadAddress, with Reply set to both.
  // Slots in {braces} are filled in for each request. Keep the slot names.
  email: {
    threadAddress: 'grouprojectnhv+library@gmail.com',
    // The same subject on every email keeps each request in one Gmail thread.
    subject: 'Lending library request: {eventName} ({eventDate})',
    pickupAddress: 'GROUP PROJECT, 140 Bradley Street, New Haven CT 06511',
    depositLine: 'Deposit due at pickup: {deposits}. It’s returned in full when everything comes back in good shape.',
    depositHeld: 'Deposit held: {deposits}. It’s returned in full when everything comes back in good shape.',
    signoff: '— The Community Events Lending Library\nGROUP PROJECT x Civic Works Department',
    policy: 'TODO: librarians — paste the borrowing policy / care agreement here before going live.',
    request: `Hi {firstName},

Thanks for your request for the {eventName}! Here's what you asked for:

{items}

Gathering: {eventDate}
Pickup: {neededFrom}{pickupWindow}
Bring back by: {returnBy}

{deposit}

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

Would you take two minutes to tell us how the gathering went? You can also leave a tip for the next host who borrows the same gear:
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
    borrow: 'TODO: Browse our catalogue and pick out what you need. Request your item(s), find a time to pick up at GROUP PROJECT, and have a great event!',
    giveBack: 'TODO: When you\'re done, bring your item(s) back to GROUP PROJECT, and let us know how it went! We encourage you to share tips & tricks so that other event-hosts can learn from your success.',
    cwd: 'TODO: write a short paragraph in your own voice about the Civic Works Department and why it is part of this.',
    groupProject: 'GROUP PROJECT is a new hub for community building in New Haven, CT. Our Community Events Lending Library will be a borrowing system of event supplies, tech, and furniture for organizers across New Haven to more easily host gatherings. This lending library will reduce the burden on organizers by gathering, storing and taking care of these items on behalf of the commons so that community members can affordably borrow items that they otherwise would not be able to, allowing them to host more successful, impactful and joyous community gatherings.',
    getInvolved: 'Reach out to groupprojectnhv@gmail.com if you’d like to donate any items, or support the library in another way!',
  },
};