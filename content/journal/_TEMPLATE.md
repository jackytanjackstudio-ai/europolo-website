---
# ═══════════════════════════════════════════════════
# HOW TO PUBLISH A JOURNAL ARTICLE
#
#   1. Copy this file to content/journal/<your-slug>.md
#   2. Fill in the front matter and write the body below the second "---"
#   3. Put the hero image in images/journal/ (JPEG, ~1536px wide, under 300 KB)
#   4. Run:  npm run build:journal
#   5. Commit the .md AND the files the build wrote, then push — that deploys
#
# The build writes <slug>.html, refreshes blog.html (listing, category
# grouping, related posts) and rewrites sitemap.xml. Nothing else to edit.
#
# Files starting with "_" are ignored, so this template is never published.
# ═══════════════════════════════════════════════════

# ── Required ──

# The URL. "leather-care-guide" publishes at /leather-care-guide.html.
# Defaults to the filename. Never change it after publishing — that breaks
# the live URL and every link to it.
slug: your-slug-here

# Quote any title containing a colon.
title: "Your Headline: A Subtitle After the Colon"

# The <meta description> and the JSON-LD description. 140–160 characters
# reads best in search results. ">" folds the indented lines into one.
description: >
  One or two sentences that would make someone click this in Google.
  Say what the reader gets, not that the article exists.

# One of the slugs in content/site.yml. An unknown value fails the build.
#   style-guides | leather-care | travel | gifting
category: style-guides

published: 2026-08-10

hero:
  src: images/journal/your-image.jpg
  # Required. Describes the photograph for screen readers and for search.
  alt: >
    A plain description of what is actually in the picture.
  # Set only when the title is baked into the artwork: the <h1> then stays
  # in the page for crawlers but is hidden visually so it is not shown twice.
  titleInHero: false

# ── Optional ──

# Italic standfirst under the title. Also the default OG/Twitter description
# and the default excerpt on the hub.
subtitle: >
  The one-line promise of the article.

# Shown when the article is edited later. Feeds dateModified and sitemap lastmod.
# updated: 2026-09-01

# The third item in the byline ("7 August 2026 · 4 min read · Wallets").
# topic: Wallets

# keywords: comma, separated, phrases
# excerpt: Overrides the hub card text if the subtitle does not suit it.
# pageTitle: Overrides the <title>. Default is "<title> | Euro Polo Malaysia".
# ogTitle: Overrides the social-share title. Default is the title.
# ogDescription: Overrides the social-share description.
# shortTitle: Breadcrumb label. Defaults to the part before the first colon.
# readTime: 4 min read      # default: computed from the word count
# draft: true               # keeps it out of the site until removed

# ── "Shop this guide" ──
# Product cards rendered from data/product-data.json. Address a product by
# any of its variant SKUs (or by "id: EP0022"); the build fails on an unknown
# one. Name, price and image come from the catalogue, so re-run the build
# after regenerating product data.
# shop:
#   eyebrow: Shop the guide
#   heading: Three ways to carry
#   intro: >
#     One line about why these three.
#   items:
#     - sku: EWB 40157 A
#       kicker: The Bifold          # small gold label above the name
#     - sku: EWB 40163 A
#       label: A shorter name       # overrides the catalogue name
#     - id: EP0045

# ── FAQ ──
# Renders a visible FAQ section AND FAQPage structured data, which is what
# search engines expand in results. Answers accept the same Markdown as the body.
# faq:
#   - q: How often should I condition full-grain leather?
#     a: >
#       Twice a year is plenty for most people.
#   - q: Can I use olive oil on leather?
#     a: |
#       No — kitchen oils go rancid.
#
#       Use a proper leather conditioner instead.

# ── Closing call to action ──
# cta:
#   heading: Explore the Euro Polo Wallet Collection
#   body: One line about the collection.
#   href: wallets.html
#   label: Shop Wallets →
---

The first paragraph is the standfirst — it renders larger and darker than the
rest. Write it as the hook.

## Headings use two hashes

Ordinary paragraphs are separated by a blank line. Inline you can use
**bold**, *italic* and [a link to a collection](wallets.html). Straight quotes
and apostrophes are curled automatically; write em dashes as — directly.

- Bullet lists work
- So do numbered lists

1. First
2. Second

> A line starting with ">" becomes the gold pull-out box. Use it for a rule of
> thumb or a quick test the reader can apply.

Place the components exactly where you want them with a marker on its own line.
Without a marker they are appended after the prose, before the CTA:

::shop::

::faq::

That is the whole dialect. Raw HTML is not supported — anything else is
published as literal text, so a stray "<" can never break the page.
