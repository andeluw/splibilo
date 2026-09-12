import { Metadata } from 'next';

import { LegalPage } from '@/components/layout/marketing/legal-page';

import { seoConfig } from '@/config/seo';

export const metadata: Metadata = seoConfig({
  title: 'Terms',
  description:
    'The terms you agree to when using Splibilo to track and settle shared expenses.',
});

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow='Terms'
      title='The agreement, in plain terms'
      updated='2 March 2026'
      intro='Using Splibilo means agreeing to what follows. It is short on purpose, because a shared expense tracker does not need ten pages of it.'
      sections={[
        {
          heading: 'Your account',
          paragraphs: [
            'One account per person, with a real email address you control. You are responsible for what happens under your account, so keep the password to yourself.',
            'We may suspend an account that is used to harass other members or to submit deliberately false records.',
          ],
        },
        {
          heading: 'What Splibilo is not',
          paragraphs: [
            'Splibilo records what a group agrees it spent. It does not move money, hold funds, or act as a payment processor. Transfers happen between you, through whatever method you already use.',
            'A balance shown here is a record of an agreement between members, not a legally enforceable debt, and it is not financial advice.',
          ],
        },
        {
          heading: 'Accuracy of records',
          paragraphs: [
            'The numbers are only as good as what gets entered. Receipt scanning is an assist, not an auditor: check the parsed fields before saving, because a mistyped total becomes a real disagreement later.',
            'Group owners set who may edit or delete an expense after it is logged. Choose those permissions deliberately.',
          ],
        },
        {
          heading: 'Availability',
          paragraphs: [
            'We work to keep Splibilo available and your records intact, and we take backups. The service is provided as is: we do not commit to a specific uptime figure, and we are not liable for losses arising from downtime or data loss.',
            'Planned maintenance is announced in advance. If we ever discontinue the service, we will give notice and a way to export your groups first.',
          ],
        },
        {
          heading: 'Changes to these terms',
          paragraphs: [
            'When these terms change materially we will update the date at the top of this page and notify you by email before the change takes effect. Continuing to use Splibilo after that means you accept the new version.',
          ],
        },
      ]}
    />
  );
}
