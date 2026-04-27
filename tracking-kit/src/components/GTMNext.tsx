/**
 * Google Tag Manager — Next.js (App Router) variant.
 *
 * Drop this into your `app/layout.tsx`. Set `NEXT_PUBLIC_GTM_ID` in
 * your env. The consent-default `<Script>` runs `beforeInteractive` so
 * it precedes GTM regardless of where in the tree GTM ends up loading.
 *
 * If you're on Pages Router instead, the same two <script> tags work
 * inside `pages/_document.tsx` — wrap them in `<Head>` and `<Html>`
 * `<Body>` respectively.
 */

import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

export function GTMHead(): JSX.Element | null {
  if (!GTM_ID) return null;
  return (
    <>
      <Script
        id="consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){ window.dataLayer.push(arguments); }
            window.gtag = window.gtag || gtag;
            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'denied',
              personalization_storage: 'denied',
              security_storage: 'granted',
              wait_for_update: 500,
            });
          `,
        }}
      />
      <Script
        id="gtm-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  );
}

export function GTMBody(): JSX.Element | null {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height={0}
        width={0}
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
