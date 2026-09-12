import { Metadata } from 'next';

export const siteConfig = {
  title: 'Splibilo',
  description:
    'Splibilo tracks shared expenses for groups: scan a receipt, split it evenly or by custom shares, and get the shortest list of payments that clears every balance.',
  url: process.env.SITE_URL ?? 'http://localhost:3000',
};

type seoConfigType = {
  title?: string;
  templateTitle?: string;
  description?: string;
} & Metadata;

export const seoConfig = ({
  title,
  templateTitle,
  description,
  ...props
}: seoConfigType) => {
  const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.title,
    title: {
      default: title ? title : siteConfig.title,
      template: templateTitle ? templateTitle : `%s | ${siteConfig.title}`,
    },
    description: description ? description : siteConfig.description,
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/icons/apple-touch-icon.png',
    },
    manifest: `/manifest.json`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteConfig.title,
    },
    openGraph: {
      url: siteConfig.url,
      title: title ? title : siteConfig.title,
      description: description ? description : siteConfig.description,
      siteName: siteConfig.title,
      images: [`${siteConfig.url}/images/logo/logo-bg.png`],
      type: 'website',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: title ? title : siteConfig.title,
      description: description ? description : siteConfig.description,
      images: [`${siteConfig.url}/images/logo/logo-bg.png`],
    },
    ...props,
  };

  return metadata;
};
