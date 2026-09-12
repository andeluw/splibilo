import * as React from 'react';

import { SiteFooter } from '@/components/layout/marketing/site-footer';
import { Navbar } from '@/components/layout/user/navbar';
import { Typography } from '@/components/typography';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

/** Shared shell for the privacy and terms pages so both read as one document
 *  family rather than two one-off layouts. */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <div className='bg-background text-foreground flex min-h-dvh flex-col'>
      <Navbar />

      <main id='main' className='flex-1'>
        <header className='ambient grain relative overflow-hidden'>
          <div className='layout-wide relative py-16 md:py-24'>
            <p className='eyebrow text-primary-700 dark:text-primary-300'>
              {eyebrow}
            </p>
            <Typography
              as='h1'
              variant='j1'
              className='mt-4 max-w-[20ch] text-4xl tracking-[-0.035em] md:text-5xl'
            >
              {title}
            </Typography>
            <Typography
              variant='b2'
              className='text-muted-foreground mt-5 max-w-[62ch] leading-relaxed'
            >
              {intro}
            </Typography>
            <p className='text-muted-foreground mt-8 text-xs'>
              Last updated {updated}
            </p>
          </div>
        </header>

        <div className='layout-wide grid gap-12 py-16 md:py-20 lg:grid-cols-12'>
          <nav aria-label='On this page' className='lg:col-span-4'>
            <p className='eyebrow text-muted-foreground'>On this page</p>
            <ul className='mt-4 space-y-2.5 lg:sticky lg:top-28'>
              {sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slug(section.heading)}`}
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className='lg:col-span-8'>
            {sections.map((section) => (
              <section
                key={section.heading}
                id={slug(section.heading)}
                className='border-border/70 border-t py-8 first:border-t-0 first:pt-0'
              >
                <Typography as='h2' variant='h2'>
                  {section.heading}
                </Typography>
                {section.paragraphs.map((paragraph) => (
                  <Typography
                    key={paragraph.slice(0, 40)}
                    variant='b3'
                    className='text-muted-foreground mt-4 max-w-[68ch] leading-relaxed'
                  >
                    {paragraph}
                  </Typography>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function slug(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
