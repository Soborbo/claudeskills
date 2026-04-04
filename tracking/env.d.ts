/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<{
  META_ACCESS_TOKEN: string;
  META_PIXEL_ID: string;
  ALLOWED_ORIGINS: string;
  TRACK_TOKEN?: string;
  TRACKING_SHEETS_WEBHOOK?: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
