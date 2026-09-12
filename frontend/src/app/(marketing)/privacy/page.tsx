import { Metadata } from 'next';

import { LegalPage } from '@/components/layout/marketing/legal-page';

import { seoConfig } from '@/config/seo';

export const metadata: Metadata = seoConfig({
  title: 'Privacy',
  description:
    'What Splibilo stores about you, why it stores it, and how to have it removed.',
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow='Privacy'
      title='What we keep, and why'
      updated='2 March 2026'
      intro='Splibilo is a shared expense tracker, so it holds records of money between people. This page sets out exactly which records those are and what happens to them.'
      sections={[
        {
          heading: 'What we store',
          paragraphs: [
            'Your account holds a name, an email address, a password, and an optional profile picture. The password is scrambled before it is saved, so nobody here can read it, including us.',
            'Inside a group we store the expenses you log: description, amount, category, date, who paid, how it was split, and any receipt image you attach. We also store the settlements you record between members.',
            'Receipt images are kept so other members can check an expense against the original. Delete the expense and the image goes with it.',
          ],
        },
        {
          heading: 'Who can see it',
          paragraphs: [
            'Members of a group can see the expenses, balances, and settlements of that group. That is the point of the product, and it is not adjustable per expense.',
            'People outside the group see nothing. Administrators can access records for support and moderation, and that access is logged.',
          ],
        },
        {
          heading: 'Receipt processing',
          paragraphs: [
            'When you scan a receipt, the text on it is sent to a third-party service that reads it and returns the items and totals. That means the wording of your receipt leaves our systems for the length of that request. It is not used to train anyone else, and we do not send your name or your group along with it.',
            'If you would rather it stayed with us, skip the scan and type the expense in by hand. Everything else works the same.',
          ],
        },
        {
          heading: 'Sessions and cookies',
          paragraphs: [
            'We use cookies to keep you signed in and to end a session safely when you sign out. There is no advertising and no third-party analytics tracking on this site.',
          ],
        },
        {
          heading: 'Deleting your data',
          paragraphs: [
            'You can delete your account from your profile. Doing so removes your personal details and detaches you from your groups.',
            'Expenses you paid for stay in the group with your name removed. Deleting them outright would quietly change what everyone else owes, which is not ours to do. Group owners can delete a whole group, and that removes everything inside it.',
          ],
        },
      ]}
    />
  );
}
