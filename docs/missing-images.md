# Missing product images — worklist

Generated 2026-07-27 from `data/image-migration-report.json`.

**368 image references still point at the Shopee CDN** (`cf.shopee.com.my`).
542 of 910 references are already served locally.

## How to use this list

1. Save each supplied image at the exact path in **Expected local file**.
2. Run `node scripts/migrate-images.js --apply`.
3. Re-run `node scripts/gen-missing-images.js` to refresh this list.

The migration script only rewrites a reference when the expected file is
actually present, so a partial drop is safe — anything still missing keeps
working from Shopee.

> Filenames are lowercase `.jpg`. A variant file is
> `<folder>-<last part of SKU, lowercased>.jpg`, e.g. SKU `EBK 40115 A`
> becomes `ebk-40115-a.jpg`.

## Summary

| Category | Missing refs | Products affected |
|---|---:|---:|
| bags | 66 | 18 |
| wallets | 229 | 37 |
| belts | 43 | 6 |
| luggage | 30 | 1 |
| **Total** | **368** | **62** |

## bags — 66 missing

| Product | SKU | Slot | Page | Expected local file | Current Shopee URL |
|---|---|---|---|---|---|
| EP0001 | EBA51208SB | variant | `product.html?id=EP0001` | `images/products/bags/eba51208s/eba51208s-b.jpg` | https://cf.shopee.com.my/file/my-11134207-820l8-mi48ui1yptl43d |
| EP0001 | EBA51208SA | variant | `product.html?id=EP0001` | `images/products/bags/eba51208s/eba51208s-a.jpg` | https://cf.shopee.com.my/file/my-11134207-820la-mi48ue9lasjl2a |
| EP0002 | EBA60302MF | variant | `product.html?id=EP0002` | `images/products/bags/eba60302m/eba60302m-f.jpg` | https://cf.shopee.com.my/file/my-11134207-820le-mlcx7ksmzfno9d |
| EP0002 | EBA60302ML | variant | `product.html?id=EP0002` | `images/products/bags/eba60302m/eba60302m-l.jpg` | https://cf.shopee.com.my/file/my-11134207-820l6-mlcx7mwzy8012b |
| EP0002 | EBA60302MA | variant | `product.html?id=EP0002` | `images/products/bags/eba60302m/eba60302m-a.jpg` | https://cf.shopee.com.my/file/my-11134207-820la-mlcx7ibgfh1c71 |
| EP0003 | EBA60301SF | variant | `product.html?id=EP0003` | `images/products/bags/eba60301s/eba60301s-f.jpg` | https://cf.shopee.com.my/file/my-11134207-820l9-ml63q4widaf77c |
| EP0003 | EBA60301SL | variant | `product.html?id=EP0003` | `images/products/bags/eba60301s/eba60301s-l.jpg` | https://cf.shopee.com.my/file/my-11134207-820lc-ml63q7od261949 |
| EP0003 | EBA60301SA | variant | `product.html?id=EP0003` | `images/products/bags/eba60301s/eba60301s-a.jpg` | https://cf.shopee.com.my/file/my-11134207-820l9-ml63pnzk8wsj83 |
| EP0003 | EBA60301SE | variant | `product.html?id=EP0003` | `images/products/bags/eba60301s/eba60301s-e.jpg` | https://cf.shopee.com.my/file/my-11134207-820la-ml63q159c360e6 |
| EP0004 | EBA51207HC | variant | `product.html?id=EP0004` | `images/products/bags/eba51207h/eba51207h-c.jpg` | https://cf.shopee.com.my/file/my-11134207-820lf-mi47qspco6pzc4 |
| EP0004 | EBA51207HA | variant | `product.html?id=EP0004` | `images/products/bags/eba51207h/eba51207h-a.jpg` | https://cf.shopee.com.my/file/my-11134207-820la-mi47qd1cvncy07 |
| EP0004 | EBA51207HB | variant | `product.html?id=EP0004` | `images/products/bags/eba51207h/eba51207h-b.jpg` | https://cf.shopee.com.my/file/my-11134207-820l9-mi47qi4hfny8ad |
| EP0005 | EBK41002BA | variant | `product.html?id=EP0005` | `images/products/bags/ebk41002b/ebk41002b-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-m9s5eom3qs4l4e |
| EP0005 | EBK41002BB | variant | `product.html?id=EP0005` | `images/products/bags/ebk41002b/ebk41002b-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-m9s5erkxefxwd0 |
| EP0005 | EBK41002BF | variant | `product.html?id=EP0005` | `images/products/bags/ebk41002b/ebk41002b-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m9s5evn5ggmsac |
| EP0005 | EBK41002BE | variant | `product.html?id=EP0005` | `images/products/bags/ebk41002b/ebk41002b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras9-m9s5ey2jwk6s80 |
| EP0006 | EBK50113BI | variant | `product.html?id=EP0006` | `images/products/bags/ebk50113b/ebk50113b-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-ma0y5hgzg25cd4 |
| EP0006 | EBK50113BA | variant | `product.html?id=EP0006` | `images/products/bags/ebk50113b/ebk50113b-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rase-ma0y4uhv2g9s4d |
| EP0006 | EBK50113BE | variant | `product.html?id=EP0006` | `images/products/bags/ebk50113b/ebk50113b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-ma0y4zolh6uqa8 |
| EP0006 | EBK50113BF | variant | `product.html?id=EP0006` | `images/products/bags/ebk50113b/ebk50113b-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rask-ma0y55q4muw006 |
| EP0007 | EBK40802BE | variant | `product.html?id=EP0007` | `images/products/bags/ebk40802b/ebk40802b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lzu8o9xs7zog35 |
| EP0007 | EBK40802BF | variant | `product.html?id=EP0007` | `images/products/bags/ebk40802b/ebk40802b-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasa-m9s3tnqlvlk5fc |
| EP0007 | EBK40802BI | variant | `product.html?id=EP0007` | `images/products/bags/ebk40802b/ebk40802b-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasf-m9s3vwbry38l6d |
| EP0007 | EBK40802BA | variant | `product.html?id=EP0007` | `images/products/bags/ebk40802b/ebk40802b-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras9-m9s3ti1k7nqd27 |
| EP0010 | EBK50102CA | variant | `product.html?id=EP0010` | `images/products/bags/ebk50102c/ebk50102c-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasa-ma0ux37vdgxed9 |
| EP0010 | EBK50102CE | variant | `product.html?id=EP0010` | `images/products/bags/ebk50102c/ebk50102c-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasi-ma0ux6w7zsheef |
| EP0010 | EBK50102CF | variant | `product.html?id=EP0010` | `images/products/bags/ebk50102c/ebk50102c-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rase-ma0uxad2x2ow25 |
| EP0011 | EBK50112BI | variant | `product.html?id=EP0011` | `images/products/bags/ebk50112b/ebk50112b-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasj-m6xngawjl115c0 |
| EP0011 | EBK50112BA | variant | `product.html?id=EP0011` | `images/products/bags/ebk50112b/ebk50112b-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras9-m6xnfyd3xn4p21 |
| EP0011 | EBK50112BE | variant | `product.html?id=EP0011` | `images/products/bags/ebk50112b/ebk50112b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasc-m6xng36svgpl3e |
| EP0011 | EBK50112BF | variant | `product.html?id=EP0011` | `images/products/bags/ebk50112b/ebk50112b-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rask-m6xng6xdejjt45 |
| EP0013 | EBK40801BI | variant | `product.html?id=EP0013` | `images/products/bags/ebk40801b/ebk40801b-i.jpg` | https://cf.shopee.com.my/file/sg-11134201-8261b-mj5ntl67sd1df4 |
| EP0013 | EBK40801BA | variant | `product.html?id=EP0013` | `images/products/bags/ebk40801b/ebk40801b-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-82618-mj5ntk6k8kxse3 |
| EP0013 | EBK40801BE | variant | `product.html?id=EP0013` | `images/products/bags/ebk40801b/ebk40801b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lzu869b7eqg0a2 |
| EP0013 | EBK40801BF | variant | `product.html?id=EP0013` | `images/products/bags/ebk40801b/ebk40801b-f.jpg` | https://cf.shopee.com.my/file/sg-11134201-82616-mj5ntkplk1z801 |
| EP0014 | EBK50110BF | variant | `product.html?id=EP0014` | `images/products/bags/ebk50110b/ebk50110b-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-ma0v2f96cooie0 |
| EP0014 | EBK50110BI | variant | `product.html?id=EP0014` | `images/products/bags/ebk50110b/ebk50110b-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasf-ma0uyybr648ia5 |
| EP0014 | EBK50110BA | variant | `product.html?id=EP0014` | `images/products/bags/ebk50110b/ebk50110b-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras9-ma0v3s4auf3mcd |
| EP0014 | EBK50110BE | variant | `product.html?id=EP0014` | `images/products/bags/ebk50110b/ebk50110b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-ma0uynd77i0i5d |
| EP0015 | EBC 40322 E | variant | `product.html?id=EP0015` | `images/products/bags/ebc-40322/ebc-40322-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lxajo2vnzw4w27 |
| EP0015 | EBC 40322 W | variant | `product.html?id=EP0015` | `images/products/bags/ebc-40322/ebc-40322-w.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lxairnauyhd6cb |
| EP0015 | EBC 40322 A | variant | `product.html?id=EP0015` | `images/products/bags/ebc-40322/ebc-40322-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r990-ls6gdf105vl099 |
| EP0015 | EBC 40322 F | variant | `product.html?id=EP0015` | `images/products/bags/ebc-40322/ebc-40322-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-ls6gdf107a5g08 |
| EP0015 | EBC 40322 P | variant | `product.html?id=EP0015` | `images/products/bags/ebc-40322/ebc-40322-p.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lxairnaux2sq07 |
| EP0018 | EBK40116BB | variant | `product.html?id=EP0018` | `images/products/bags/ebk-40116/ebk-40116-bb.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m9s65kzkn6qo8b |
| EP0018 | EBK40116BE | variant | `product.html?id=EP0018` | `images/products/bags/ebk-40116/ebk-40116-be.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras9-ma0uvtecfco076 |
| EP0018 | EBK40116BF | variant | `product.html?id=EP0018` | `images/products/bags/ebk-40116/ebk-40116-bf.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-ma0uvwvrbtnk1f |
| EP0018 | EBK40116BA | variant | `product.html?id=EP0018` | `images/products/bags/ebk-40116/ebk-40116-ba.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-ma0uvpnrwa2ae5 |
| EP0019 | EBK50101BE | variant | `product.html?id=EP0019` | `images/products/bags/ebk50101b/ebk50101b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras9-ma0uvtecfco076 |
| EP0019 | EBK50101BA | variant | `product.html?id=EP0019` | `images/products/bags/ebk50101b/ebk50101b-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-ma0uvpnrwa2ae5 |
| EP0019 | EBK50101BF | variant | `product.html?id=EP0019` | `images/products/bags/ebk50101b/ebk50101b-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-ma0uvwvrbtnk1f |
| EP0023 | EBK 40312 AK | variant | `product.html?id=EP0023` | `images/products/bags/ebk-40312/ebk-40312-ak.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lxw8h1pfh6y851 |
| EP0023 | EBK 40312 AP | variant | `product.html?id=EP0023` | `images/products/bags/ebk-40312/ebk-40312-ap.jpg` | https://cf.shopee.com.my/file/my-11134207-7r991-lxw8gvri68vk24 |
| EP0023 | EBK 40312 AE | variant | `product.html?id=EP0023` | `images/products/bags/ebk-40312/ebk-40312-ae.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lxw8ga0rzo8g73 |
| EP0023 | EBK 40312 AF | variant | `product.html?id=EP0023` | `images/products/bags/ebk-40312/ebk-40312-af.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lxw8gkzbyaui91 |
| EP0023 | EBK 40312 AI | variant | `product.html?id=EP0023` | `images/products/bags/ebk-40312/ebk-40312-ai.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-lxw8hi2hj6ggf2 |
| EP0024 | EBK 40310 F | variant | `product.html?id=EP0024` | `images/products/bags/ebk-40310/ebk-40310-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-lt50itye8l4nc7 |
| EP0024 | EBK 40310 A | variant | `product.html?id=EP0024` | `images/products/bags/ebk-40310/ebk-40310-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lt4rio45zjlj87 |
| EP0024 | EBK 40310 E | variant | `product.html?id=EP0024` | `images/products/bags/ebk-40310/ebk-40310-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt4rio460y5zbe |
| EP0039 | EBK50111BF | variant | `product.html?id=EP0039` | `images/products/bags/ebk50111b/ebk50111b-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasb-ma0v5erj0w6qbf |
| EP0039 | EBK50111BB | variant | `product.html?id=EP0039` | `images/products/bags/ebk50111b/ebk50111b-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-ma0v5jmvwa2a62 |
| EP0039 | EBK50111BA | variant | `product.html?id=EP0039` | `images/products/bags/ebk50111b/ebk50111b-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-ma0v56ix2y1s74 |
| EP0039 | EBK50111BE | variant | `product.html?id=EP0039` | `images/products/bags/ebk50111b/ebk50111b-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasi-ma0v5ak16l7ka0 |
| EP0055 | EBK 40309 A | variant | `product.html?id=EP0055` | `images/products/bags/ebk-40309/ebk-40309-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lt4rio45zjlj87 |
| EP0055 | EBK 40309 E | variant | `product.html?id=EP0055` | `images/products/bags/ebk-40309/ebk-40309-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt4rio460y5zbe |
| EP0055 | EBK 40309 F | variant | `product.html?id=EP0055` | `images/products/bags/ebk-40309/ebk-40309-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-lt50itye8l4nc7 |

## wallets — 229 missing

| Product | SKU | Slot | Page | Expected local file | Current Shopee URL |
|---|---|---|---|---|---|
| EP0009 | EWB41052CA | variant | `product.html?id=EP0009` | `images/products/wallets/ep-classic-set/ep-classic-set-ewb41052ca.jpg` | https://cf.shopee.com.my/file/my-11134207-7rase-mb4se5b63cbv0e |
| EP0009 | EWB410531A | variant | `product.html?id=EP0009` | `images/products/wallets/ep-classic-set/ep-classic-set-ewb410531a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasj-mb4sl3ce76i26c |
| EP0009 | EWB410541A | variant | `product.html?id=EP0009` | `images/products/wallets/ep-classic-set/ep-classic-set-ewb410541a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-mb4sl95bpfoq5f |
| EP0009 | EWB4105312A | variant | `product.html?id=EP0009` | `images/products/wallets/ep-classic-set/ep-classic-set-ewb4105312a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-mb4snp72uuiecb |
| EP0009 | EWB4105412A | variant | `product.html?id=EP0009` | `images/products/wallets/ep-classic-set/ep-classic-set-ewb4105412a.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-mb4so05ctvcmcf |
| EP0009 | EWK41051KA | variant | `product.html?id=EP0009` | `images/products/wallets/ep-classic-set/ep-classic-set-ewk41051ka.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-mb4sdwdl5xx2b7 |
| EP0012 | EWB50156LA | variant | `product.html?id=EP0012` | `images/products/wallets/ewb-50156-50157-l/ewb-50156-50157-l-ewb50156la.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-m6xev58yhit52e |
| EP0012 | EWB50157LA | variant | `product.html?id=EP0012` | `images/products/wallets/ewb-50156-50157-l/ewb-50156-50157-l-ewb50157la.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-m6xev58yhit52e |
| EP0012 | EWB50156LB | variant | `product.html?id=EP0012` | `images/products/wallets/ewb-50156-50157-l/ewb-50156-50157-l-ewb50156lb.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras8-m6xevaaz35nd00 |
| EP0012 | EWB50157LB | variant | `product.html?id=EP0012` | `images/products/wallets/ewb-50156-50157-l/ewb-50156-50157-l-ewb50157lb.jpg` | https://cf.shopee.com.my/file/my-11134207-7ras8-m6xevaaz35nd00 |
| EP0020 | EWB 40355 AB | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-ab.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt6f1r4sp59z72 |
| EP0020 | EWB 40355 BC | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-bc.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt6f1r4sqjuf6f |
| EP0020 | EWB 40354 AI | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-ai.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt6f1r4snqpj09 |
| EP0020 | EWB 40355 AI | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-ai.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt6f1r4snqpj09 |
| EP0020 | EWB 40354 BC | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-bc.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt6f1r4sqjuf6f |
| EP0020 | EWB 40356 AB | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-ab.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt6f1r4sp59z72 |
| EP0020 | EWB 40354 AB | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-ab.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt6f1r4sp59z72 |
| EP0020 | EWB 40356 BC | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-bc.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt6f1r4sqjuf6f |
| EP0020 | EWB 40356 AI | variant | `product.html?id=EP0020` | `images/products/wallets/ewb-40354-40355-40356/ewb-40354-40355-40356-ai.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt6f1r4snqpj09 |
| EP0021 | EWB 40163 A | variant | `product.html?id=EP0021` | `images/products/wallets/ewb-40163/ewb-40163-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-0lcfhvrop4kv02 |
| EP0021 | EWB 40163 B | variant | `product.html?id=EP0021` | `images/products/wallets/ewb-40163/ewb-40163-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-odffvkuop4kvd8 |
| EP0021 | EWB 40163 C | variant | `product.html?id=EP0021` | `images/products/wallets/ewb-40163/ewb-40163-c.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-lshy9c1op4kv62 |
| EP0021 | EWB 40163 D | variant | `product.html?id=EP0021` | `images/products/wallets/ewb-40163/ewb-40163-d.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lq8r2cjk8fge78 |
| EP0021 | EWB 40163 M | variant | `product.html?id=EP0021` | `images/products/wallets/ewb-40163/ewb-40163-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lq8r2cjk70vy22 |
| EP0022 | EWB 40157 A | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98u-ltkmuwk5lu8ead |
| EP0022 | EWB 40157 B | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98u-ltkmuwk5lu8ead |
| EP0022 | EWB 40158 A | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-ltkmuwk5n8sub0 |
| EP0022 | EWB 40158 B | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-ltkmuwk5n8sub0 |
| EP0022 | EWB 40159 A | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-ltkmuwk5ondaea |
| EP0022 | EWB 40159 B | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-ltkmuwk5ondaea |
| EP0022 | EWB 40160 A | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-ltkmuwk66wr238 |
| EP0022 | EWB 40160 B | variant | `product.html?id=EP0022` | `images/products/wallets/ewb-40157-40158-40159-40160/ewb-40157-40158-40159-40160-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-ltkmuwk66wr238 |
| EP0025 | EWB 40166 B | variant | `product.html?id=EP0025` | `images/products/wallets/ewb-40165-40166-40167/ewb-40165-40166-40167-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-ls6htopglbsnfa |
| EP0025 | EWB 40167 A | variant | `product.html?id=EP0025` | `images/products/wallets/ewb-40165-40166-40167/ewb-40165-40166-40167-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-l9dej33ds6iv2b |
| EP0025 | EWB 40167 B | variant | `product.html?id=EP0025` | `images/products/wallets/ewb-40165-40166-40167/ewb-40165-40166-40167-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-l9dej33ds6iv2b |
| EP0025 | EWB 40165 A | variant | `product.html?id=EP0025` | `images/products/wallets/ewb-40165-40166-40167/ewb-40165-40166-40167-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-ls6htopgjx87ea |
| EP0025 | EWB 40165 B | variant | `product.html?id=EP0025` | `images/products/wallets/ewb-40165-40166-40167/ewb-40165-40166-40167-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-ls6htopgjx87ea |
| EP0025 | EWB 40166 A | variant | `product.html?id=EP0025` | `images/products/wallets/ewb-40165-40166-40167/ewb-40165-40166-40167-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-ls6htopglbsnfa |
| EP0026 | EWA 40172 A | variant | `product.html?id=EP0026` | `images/products/wallets/ewa-40172-40175/ewa-40172-40175-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt4mlotbgizo38 |
| EP0026 | EWA 40172 B | variant | `product.html?id=EP0026` | `images/products/wallets/ewa-40172-40175/ewa-40172-40175-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt4mlotbgizo38 |
| EP0026 | EWA 40175 A | variant | `product.html?id=EP0026` | `images/products/wallets/ewa-40172-40175/ewa-40172-40175-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt4mlotbhxk4b9 |
| EP0026 | EWA 40175 B | variant | `product.html?id=EP0026` | `images/products/wallets/ewa-40172-40175/ewa-40172-40175-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt4mlotbhxk4b9 |
| EP0027 | EWA 40173 A | variant | `product.html?id=EP0027` | `images/products/wallets/ewa-40173-40174/ewa-40173-40174-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lt4mlotlzsbo11 |
| EP0027 | EWA 40173 B | variant | `product.html?id=EP0027` | `images/products/wallets/ewa-40173-40174/ewa-40173-40174-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lt4mlotlzsbo11 |
| EP0027 | EWA 40174 A | variant | `product.html?id=EP0027` | `images/products/wallets/ewa-40173-40174/ewa-40173-40174-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98q-lt4mlotm16w461 |
| EP0027 | EWA 40174 B | variant | `product.html?id=EP0027` | `images/products/wallets/ewa-40173-40174/ewa-40173-40174-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98q-lt4mlotm16w461 |
| EP0028 | EWB 40351 AI | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-ai.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt6f1r4snqpj09 |
| EP0028 | EWB 40351 AB | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-ab.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt6f1r4sp59z72 |
| EP0028 | EWB 40353 AI | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-ai.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt6f1r4snqpj09 |
| EP0028 | EWB 40353 BC | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-bc.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt6f1r4sqjuf6f |
| EP0028 | EWB 40352 AB | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-ab.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt6f1r4sp59z72 |
| EP0028 | EWB 40352 BC | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-bc.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt6f1r4sqjuf6f |
| EP0028 | EWB 40353 AB | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-ab.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lt6f1r4sp59z72 |
| EP0028 | EWB 40351 BC | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-bc.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt6f1r4sqjuf6f |
| EP0028 | EWB 40352 AI | variant | `product.html?id=EP0028` | `images/products/wallets/ewb-40351-40352-40353/ewb-40351-40352-40353-ai.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt6f1r4snqpj09 |
| EP0029 | EWB 40164 M | variant | `product.html?id=EP0029` | `images/products/wallets/ewb-40164/ewb-40164-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98o-lq8r2cju9fx112 |
| EP0029 | EWB 40164 A | variant | `product.html?id=EP0029` | `images/products/wallets/ewb-40164/ewb-40164-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lq8r2cju2ekefb |
| EP0029 | EWB 40164 B | variant | `product.html?id=EP0029` | `images/products/wallets/ewb-40164/ewb-40164-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-lq8r2cju3t4ub6 |
| EP0029 | EWB 40164 C | variant | `product.html?id=EP0029` | `images/products/wallets/ewb-40164/ewb-40164-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lq8r2cju6ms553 |
| EP0029 | EWB 40164 D | variant | `product.html?id=EP0029` | `images/products/wallets/ewb-40164/ewb-40164-d.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98s-lq8r2cju81cl65 |
| EP0030 | EWB 40361 A | variant | `product.html?id=EP0030` | `images/products/wallets/ewb-40361/ewb-40361-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt639qa2ahwkdf |
| EP0030 | EWB 40361 B | variant | `product.html?id=EP0030` | `images/products/wallets/ewb-40361/ewb-40361-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt639qa2bwh035 |
| EP0030 | EWB 40361 C | variant | `product.html?id=EP0030` | `images/products/wallets/ewb-40361/ewb-40361-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lt639qa2db1g91 |
| EP0031 | EWB 40162 D | variant | `product.html?id=EP0031` | `images/products/wallets/ewb-40162/ewb-40162-d.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lq8r2cjknvpa2d |
| EP0031 | EWB 40162 M | variant | `product.html?id=EP0031` | `images/products/wallets/ewb-40162/ewb-40162-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7r991-lq8r2cjkpa9q9f |
| EP0031 | EWB 40162 A | variant | `product.html?id=EP0031` | `images/products/wallets/ewb-40162/ewb-40162-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lq8r2cjkwbmd79 |
| EP0031 | EWB 40162 B | variant | `product.html?id=EP0031` | `images/products/wallets/ewb-40162/ewb-40162-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lq8r2cjkxq6t19 |
| EP0031 | EWB 40162 C | variant | `product.html?id=EP0031` | `images/products/wallets/ewb-40162/ewb-40162-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lq8r2cjkz4r9b5 |
| EP0032 | EWB 40161 D | variant | `product.html?id=EP0032` | `images/products/wallets/ewb-40161/ewb-40161-d.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lq8r2cjk1em68f |
| EP0032 | EWB 40161 M | variant | `product.html?id=EP0032` | `images/products/wallets/ewb-40161/ewb-40161-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lq8r2cjk2t6m76 |
| EP0032 | EWB 40161 A | variant | `product.html?id=EP0032` | `images/products/wallets/ewb-40161/ewb-40161-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lq8r2cjjx6wu4b |
| EP0032 | EWB 40161 B | variant | `product.html?id=EP0032` | `images/products/wallets/ewb-40161/ewb-40161-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-lq8r2cjjylha96 |
| EP0032 | EWB 40161 C | variant | `product.html?id=EP0032` | `images/products/wallets/ewb-40161/ewb-40161-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lq8r2cjk001q81 |
| EP0033 | EWB 40357 C | variant | `product.html?id=EP0033` | `images/products/wallets/ewb-40357-40358/ewb-40357-40358-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lt639qa2db1g91 |
| EP0033 | EWB 40358 C | variant | `product.html?id=EP0033` | `images/products/wallets/ewb-40357-40358/ewb-40357-40358-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lt639qa2db1g91 |
| EP0033 | EWB 40357 A | variant | `product.html?id=EP0033` | `images/products/wallets/ewb-40357-40358/ewb-40357-40358-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt639qa2ahwkdf |
| EP0033 | EWB 40358 A | variant | `product.html?id=EP0033` | `images/products/wallets/ewb-40357-40358/ewb-40357-40358-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt639qa2ahwkdf |
| EP0033 | EWB 40357 B | variant | `product.html?id=EP0033` | `images/products/wallets/ewb-40357-40358/ewb-40357-40358-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt639qa2bwh035 |
| EP0033 | EWB 40358 B | variant | `product.html?id=EP0033` | `images/products/wallets/ewb-40357-40358/ewb-40357-40358-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt639qa2bwh035 |
| EP0035 | EWB 40362 A | variant | `product.html?id=EP0035` | `images/products/wallets/ewb-40362/ewb-40362-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98s-lt4rio2sh0xj6e |
| EP0035 | EWB 40362 B | variant | `product.html?id=EP0035` | `images/products/wallets/ewb-40362/ewb-40362-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98q-lt4rio2sifhz5a |
| EP0035 | EWB 40362 C | variant | `product.html?id=EP0035` | `images/products/wallets/ewb-40362/ewb-40362-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r991-lt4rio2rqc53b7 |
| EP0036 | EWB 40360 C | variant | `product.html?id=EP0036` | `images/products/wallets/ewb-40360/ewb-40360-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lt639qa2db1g91 |
| EP0036 | EWB 40360 A | variant | `product.html?id=EP0036` | `images/products/wallets/ewb-40360/ewb-40360-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt639qa2ahwkdf |
| EP0036 | EWB 40360 B | variant | `product.html?id=EP0036` | `images/products/wallets/ewb-40360/ewb-40360-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt639qa2bwh035 |
| EP0037 | EWA 40170 A | variant | `product.html?id=EP0037` | `images/products/wallets/ewa-40170-40171/ewa-40170-40171-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98o-lt4mlotlhixw5e |
| EP0037 | EWA 40170 B | variant | `product.html?id=EP0037` | `images/products/wallets/ewa-40170-40171/ewa-40170-40171-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98o-lt4mlotlhixw5e |
| EP0037 | EWA 40171 A | variant | `product.html?id=EP0037` | `images/products/wallets/ewa-40170-40171/ewa-40170-40171-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lt4mlotlixicdb |
| EP0037 | EWA 40171 B | variant | `product.html?id=EP0037` | `images/products/wallets/ewa-40170-40171/ewa-40170-40171-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lt4mlotlixicdb |
| EP0038 | EWB 40363 B | variant | `product.html?id=EP0038` | `images/products/wallets/ewb-40363/ewb-40363-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lt4rio2t3i0n8b |
| EP0038 | EWB 40363 C | variant | `product.html?id=EP0038` | `images/products/wallets/ewb-40363/ewb-40363-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-lt4rio2t4wl3b6 |
| EP0038 | EWB 40363 A | variant | `product.html?id=EP0038` | `images/products/wallets/ewb-40363/ewb-40363-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r990-lt4rio2t23g77c |
| EP0040 | EWB 40359 B | variant | `product.html?id=EP0040` | `images/products/wallets/ewb-40359/ewb-40359-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98y-lt639qa2bwh035 |
| EP0040 | EWB 40359 C | variant | `product.html?id=EP0040` | `images/products/wallets/ewb-40359/ewb-40359-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lt639qa2db1g91 |
| EP0040 | EWB 40359 A | variant | `product.html?id=EP0040` | `images/products/wallets/ewb-40359/ewb-40359-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lt639qa2ahwkdf |
| EP0041 | EWB 30562 I | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul4-ljgtjc5ozevudc |
| EP0041 | EWB 30561 A | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul7-ljgtjc5oy0bebd |
| EP0041 | EWB 30561 B | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul7-ljgtjc5oy0bebd |
| EP0041 | EWB 30561 F | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul7-ljgtjc5oy0bebd |
| EP0041 | EWB 30561 I | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul7-ljgtjc5oy0bebd |
| EP0041 | EWB 30562 A | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul4-ljgtjc5ozevudc |
| EP0041 | EWB 30562 B | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul4-ljgtjc5ozevudc |
| EP0041 | EWB 30562 F | variant | `product.html?id=EP0041` | `images/products/wallets/ewb-30561-ewb-30562/ewb-30561-ewb-30562-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul4-ljgtjc5ozevudc |
| EP0042 | EWB 30354 B | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-lfhnkno5uyvte8 |
| EP0042 | EWB 30354 C | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-lfhnkno5uyvte8 |
| EP0042 | EWB 30354 A | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-lfhnkno5uyvte8 |
| EP0042 | EWB 30356 B | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-lfhnkno5xs0pc7 |
| EP0042 | EWB 30355 C | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-lfhnkno5wdg91f |
| EP0042 | EWB 30355 A | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-lfhnkno5wdg91f |
| EP0042 | EWB 30355 B | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-lfhnkno5wdg91f |
| EP0042 | EWB 30356 C | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-lfhnkno5xs0pc7 |
| EP0042 | EWB 30356 A | variant | `product.html?id=EP0042` | `images/products/wallets/ewb-30354-30355-30356/ewb-30354-30355-30356-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-lfhnkno5xs0pc7 |
| EP0044 | EWB 30199 M | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-ls15dfzjwy0497 |
| EP0044 | EWB 30199 A | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lmeg0jv4d9xydc |
| EP0044 | EWB 30199 B | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lmeg0jv4eoiefe |
| EP0044 | EWB 30199 E | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98r-ls15dfzjrbqc79 |
| EP0044 | EWB 30199 F | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98q-ls15dfzjsqas26 |
| EP0044 | EWB 30199 L | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-l.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98o-ls15dfzju4v8c2 |
| EP0044 | EWB 30199 P | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-p.jpg` | https://cf.shopee.com.my/file/my-11134207-7r991-ls15dfzjvjfo54 |
| EP0044 | EWB 30199 FI | variant | `product.html?id=EP0044` | `images/products/wallets/ewb-30199/ewb-30199-fi.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasj-m2t1zma1yw4m13 |
| EP0045 | EWB 40168 A | variant | `product.html?id=EP0045` | `images/products/wallets/ewb-40168/ewb-40168-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98q-ls6htoph0s1jeb |
| EP0045 | EWB 40168 B | variant | `product.html?id=EP0045` | `images/products/wallets/ewb-40168/ewb-40168-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7r991-ls6htoph26lzee |
| EP0046 | EWB 20964 I | variant | `product.html?id=EP0046` | `images/products/wallets/ewb-20964/ewb-20964-i.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-t0rxqhegjmlvb2 |
| EP0046 | EWB 20964 P | variant | `product.html?id=EP0046` | `images/products/wallets/ewb-20964/ewb-20964-p.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-3h5gqwigjmlvda |
| EP0046 | EWB 20964 A | variant | `product.html?id=EP0046` | `images/products/wallets/ewb-20964/ewb-20964-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljmecbz1h8gqcc |
| EP0046 | EWB 20964 B | variant | `product.html?id=EP0046` | `images/products/wallets/ewb-20964/ewb-20964-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-uxhy9s1fjmlve3 |
| EP0046 | EWB 20964 E | variant | `product.html?id=EP0046` | `images/products/wallets/ewb-20964/ewb-20964-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmecbz1lg6208 |
| EP0046 | EWB 20964 F | variant | `product.html?id=EP0046` | `images/products/wallets/ewb-20964/ewb-20964-f.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-7rslanagjmlve7 |
| EP0047 | EWB 30551 A2 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a2.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmdzmr0yja263 |
| EP0047 | EWB 30551 A3 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a3.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmdzmr0yja263 |
| EP0047 | EWB 30552 A1 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a1.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukw-ljmdzmr0zxui2a |
| EP0047 | EWB 30553 A3 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a3.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul1-ljmdzmr11ceyf8 |
| EP0047 | EWB 30552 A3 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a3.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukw-ljmdzmr0zxui2a |
| EP0047 | EWB 30552 A2 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a2.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukw-ljmdzmr0zxui2a |
| EP0047 | EWB 30553 A2 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a2.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul1-ljmdzmr11ceyf8 |
| EP0047 | EWB 30553 A1 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a1.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul1-ljmdzmr11ceyf8 |
| EP0047 | EWB 30551 A1 | variant | `product.html?id=EP0047` | `images/products/wallets/ewb-30551-ewb-30552-ewb-30553/ewb-30551-ewb-30552-ewb-30553-a1.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmdzmr0yja263 |
| EP0048 | EWB 30567 B | variant | `product.html?id=EP0048` | `images/products/wallets/ewb-30567/ewb-30567-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul6-ljgtjc5p515mde |
| EP0048 | EWB 30567 A | variant | `product.html?id=EP0048` | `images/products/wallets/ewb-30567/ewb-30567-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul8-ljgtjc5p3ml695 |
| EP0049 | EWB 20968 A | variant | `product.html?id=EP0049` | `images/products/wallets/ewb-20967-209668/ewb-20967-209668-a.jpg` | https://cf.shopee.com.my/file/my-11134207-23010-5surmjx2f7lvcd |
| EP0049 | EWB 20967 B | variant | `product.html?id=EP0049` | `images/products/wallets/ewb-20967-209668/ewb-20967-209668-b.jpg` | https://cf.shopee.com.my/file/my-11134207-23010-5wdheif3f7lv42 |
| EP0049 | EWB 20968 B | variant | `product.html?id=EP0049` | `images/products/wallets/ewb-20967-209668/ewb-20967-209668-b.jpg` | https://cf.shopee.com.my/file/my-11134207-23010-5wdheif3f7lv42 |
| EP0049 | EWB 20967 C | variant | `product.html?id=EP0049` | `images/products/wallets/ewb-20967-209668/ewb-20967-209668-c.jpg` | https://cf.shopee.com.my/file/my-11134207-23010-mjgkihu3f7lv2c |
| EP0049 | EWB 20968 C | variant | `product.html?id=EP0049` | `images/products/wallets/ewb-20967-209668/ewb-20967-209668-c.jpg` | https://cf.shopee.com.my/file/my-11134207-23010-mjgkihu3f7lv2c |
| EP0049 | EWB 20967 A | variant | `product.html?id=EP0049` | `images/products/wallets/ewb-20967-209668/ewb-20967-209668-a.jpg` | https://cf.shopee.com.my/file/my-11134207-23010-5surmjx2f7lvcd |
| EP0050 | EWB 30564 A | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljl4f8jlad5m1f |
| EP0050 | EWB 30564 B | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljl4f8jlad5m1f |
| EP0050 | EWB 30564 F | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljl4f8jlad5m1f |
| EP0050 | EWB30564G | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-ewb30564g.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljl4f8jlad5m1f |
| EP0050 | EWB 30563 A | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljl4f8jl8yl6b0 |
| EP0050 | EWB 30563 B | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljl4f8jl8yl6b0 |
| EP0050 | EWB 30563 F | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljl4f8jl8yl6b0 |
| EP0050 | EWB 30563 I | variant | `product.html?id=EP0050` | `images/products/wallets/ewb-30563-ewb-30564/ewb-30563-ewb-30564-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljl4f8jl8yl6b0 |
| EP0052 | EWB 20960 A | variant | `product.html?id=EP0052` | `images/products/wallets/ewb-20960/ewb-20960-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-5nnj9sl2qpkv6b |
| EP0052 | EWB 20960 B | variant | `product.html?id=EP0052` | `images/products/wallets/ewb-20960/ewb-20960-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-v41n86o2qpkv1c |
| EP0052 | EWB 20960 E | variant | `product.html?id=EP0052` | `images/products/wallets/ewb-20960/ewb-20960-e.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-fbg929t2qpkv5e |
| EP0052 | EWB 20960 F | variant | `product.html?id=EP0052` | `images/products/wallets/ewb-20960/ewb-20960-f.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-scliq6x2qpkvc6 |
| EP0052 | EWB 20960 I | variant | `product.html?id=EP0052` | `images/products/wallets/ewb-20960/ewb-20960-i.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-o2lky822qpkv24 |
| EP0052 | EWB 20960 P | variant | `product.html?id=EP0052` | `images/products/wallets/ewb-20960/ewb-20960-p.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-j1viwq82qpkvd3 |
| EP0053 | EWB 20962 B | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-ljmecbz1r2fu5e |
| EP0053 | EWB 20961 M | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-ls15dfzjoilgab |
| EP0053 | EWB 20962 F | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmecbz1tvkq3f |
| EP0053 | EWB 20961 B | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-ljmecbz1r2fu5e |
| EP0053 | EWB 20961 P | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-p.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul4-ljmjl9jc7p06b7 |
| EP0053 | EWB 20961 A | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmecbz1pnve8e |
| EP0053 | EWB 20961 F | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-f.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmecbz1tvkq3f |
| EP0053 | EWB 20962 M | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7r992-ls15dfzjoilgab |
| EP0053 | EWB 20962 E | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul7-ljmecbz1sh0aa7 |
| EP0053 | EWB 20962 P | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-p.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul4-ljmjl9jc7p06b7 |
| EP0053 | EWB 20961 E | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul7-ljmecbz1sh0aa7 |
| EP0053 | EWB 20962 A | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmecbz1pnve8e |
| EP0053 | EWB 20961 I | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukw-ljmjl9jc6afq04 |
| EP0053 | EWB 20962 I | variant | `product.html?id=EP0053` | `images/products/wallets/ewb-20961-20962/ewb-20961-20962-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukw-ljmjl9jc6afq04 |
| EP0056 | EWB 50159 L A | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljmecbz1h8gqcc |
| EP0056 | EWB 20969 M | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-ljmecbz1o9ay6f |
| EP0056 | EWB 50160 L C | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljmecbz1k1lm37 |
| EP0056 | EWB 20969 I | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljmecbz1muqi52 |
| EP0056 | EWB 50160 L A | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljmecbz1h8gqcc |
| EP0056 | EWB 20970 I | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-i.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljmecbz1muqi52 |
| EP0056 | EWB 20969 E | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmecbz1lg6208 |
| EP0056 | EWB 50159 L B | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul3-ljmecbz1in168c |
| EP0056 | EWB 20970 M | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-m.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-ljmecbz1o9ay6f |
| EP0056 | EWB 50160 L B | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul3-ljmecbz1in168c |
| EP0056 | EWB 50159 L C | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul9-ljmecbz1k1lm37 |
| EP0056 | EWB 20970 E | variant | `product.html?id=EP0056` | `images/products/wallets/ewb-50159l-60l-20969-70/ewb-50159l-60l-20969-70-e.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljmecbz1lg6208 |
| EP0057 | EWB 30556 A2 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a2.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul3-ljmdzmr15k4af6 |
| EP0057 | EWB 30554 A2 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a2.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljmdzmr12qzedb |
| EP0057 | EWB 30555 A3 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a3.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-ljmdzmr145judc |
| EP0057 | EWB 30554 A1 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a1.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljmdzmr12qzedb |
| EP0057 | EWB 30554 A3 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a3.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukz-ljmdzmr12qzedb |
| EP0057 | EWB 30556 A1 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a1.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul3-ljmdzmr15k4af6 |
| EP0057 | EWB 30556 A3 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a3.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul3-ljmdzmr15k4af6 |
| EP0057 | EWB 30555 A2 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a2.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-ljmdzmr145judc |
| EP0057 | EWB 30555 A1 | variant | `product.html?id=EP0057` | `images/products/wallets/ewb-30554-ewb-30555-ewb-30556/ewb-30554-ewb-30555-ewb-30556-a1.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-ljmdzmr145judc |
| EP0058 | EWB 30353 B | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-lfhnkno5xs0pc7 |
| EP0058 | EWB 30351 B | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-lfhnkno5uyvte8 |
| EP0058 | EWB 30352 B | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-lfhnkno5wdg91f |
| EP0058 | EWB 30352 A | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-lfhnkno5wdg91f |
| EP0058 | EWB 30351 C | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-lfhnkno5uyvte8 |
| EP0058 | EWB 30351 A | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul5-lfhnkno5uyvte8 |
| EP0058 | EWB 30353 A | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-lfhnkno5xs0pc7 |
| EP0058 | EWB 30353 C | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qukx-lfhnkno5xs0pc7 |
| EP0058 | EWB 30352 C | variant | `product.html?id=EP0058` | `images/products/wallets/ewb-30351-30352-30353/ewb-30351-30352-30353-c.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul2-lfhnkno5wdg91f |
| EP0059 | EWB 20951 A | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-68mg0tjds6iv27 |
| EP0059 | EWB 20953 C | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-c.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-l9dej33ds6iv2b |
| EP0059 | EWB 20951 C | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-c.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-68mg0tjds6iv27 |
| EP0059 | EWB 20952 B | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-smy0e0les6ivd6 |
| EP0059 | EWB 20951 B | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-68mg0tjds6iv27 |
| EP0059 | EWB 20952 A | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-smy0e0les6ivd6 |
| EP0059 | EWB 20953 A | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-l9dej33ds6iv2b |
| EP0059 | EWB 20953 B | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-l9dej33ds6iv2b |
| EP0059 | EWB 20952 C | variant | `product.html?id=EP0059` | `images/products/wallets/ewb-20951-20952-20953/ewb-20951-20952-20953-c.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-smy0e0les6ivd6 |
| EP0060 | EWB 30566 A | variant | `product.html?id=EP0060` | `images/products/wallets/ewb-30565-ewb-30566/ewb-30565-ewb-30566-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljgtjc5p280q3f |
| EP0060 | EWB 30566 B | variant | `product.html?id=EP0060` | `images/products/wallets/ewb-30565-ewb-30566/ewb-30565-ewb-30566-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul0-ljgtjc5p280q3f |
| EP0060 | EWB 30565 A | variant | `product.html?id=EP0060` | `images/products/wallets/ewb-30565-ewb-30566/ewb-30565-ewb-30566-a.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul1-ljgtjc5p0tga34 |
| EP0060 | EWB 30565 B | variant | `product.html?id=EP0060` | `images/products/wallets/ewb-30565-ewb-30566/ewb-30565-ewb-30566-b.jpg` | https://cf.shopee.com.my/file/my-11134207-7qul1-ljgtjc5p0tga34 |
| EP0061 | EP 21083 A 2 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-2.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lx1xp4k45v1s3e |
| EP0061 | EP 21083 A 1 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-1.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lx1xp4k44ghcd2 |
| EP0061 | EP 21081 A 1 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-1.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lx1xp4k44ghcd2 |
| EP0061 | EP 21081 A 3 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-3.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lx1xp4k479m84f |
| EP0061 | EP 21083 A 3 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-3.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lx1xp4k479m84f |
| EP0061 | EP 21082 A 2 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-2.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lx1xp4k45v1s3e |
| EP0061 | EP 21082 A 1 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-1.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lx1xp4k44ghcd2 |
| EP0061 | EP 21081 A 2 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-2.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98z-lx1xp4k45v1s3e |
| EP0061 | EP 21082 A 3 | variant | `product.html?id=EP0061` | `images/products/wallets/ep-set/ep-set-3.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98p-lx1xp4k479m84f |
| EP0062 | EWB 20965 C | variant | `product.html?id=EP0062` | `images/products/wallets/ewb-20965/ewb-20965-c.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-w5di44l05klv32 |
| EP0062 | EWB 20965 M | variant | `product.html?id=EP0062` | `images/products/wallets/ewb-20965/ewb-20965-m.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-oz6ym8o05klv4b |
| EP0062 | EWB 20965 A | variant | `product.html?id=EP0062` | `images/products/wallets/ewb-20965/ewb-20965-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-0l5vg4g05klv6f |
| EP0062 | EWB 20965 B | variant | `product.html?id=EP0062` | `images/products/wallets/ewb-20965/ewb-20965-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22120-9xph6dj05klvf0 |

## belts — 43 missing

| Product | SKU | Slot | Page | Expected local file | Current Shopee URL |
|---|---|---|---|---|---|
| EP0016 | EBL2512AE | variant | `product.html?id=EP0016` | `images/products/belts/ebl2512/ebl2512-ae.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-mb6cgqol9lajf9 |
| EP0016 | EBL2512AR | variant | `product.html?id=EP0016` | `images/products/belts/ebl2512/ebl2512-ar.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-mb6cgckk8aeif8 |
| EP0016 | EBL2512AB | variant | `product.html?id=EP0016` | `images/products/belts/ebl2512/ebl2512-ab.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-mb6cggd2da5m57 |
| EP0016 | EBL2512AW | variant | `product.html?id=EP0016` | `images/products/belts/ebl2512/ebl2512-aw.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasc-mb6cgmk5atjfcf |
| EP0017 | EBL1501A8 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-8.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lr3wm333olpzb0 |
| EP0017 | EBL1501A13 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-13.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lyw1i8yhbza8e4 |
| EP0017 | EBL1501A5 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-5.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98u-lr3wm333yfqce4 |
| EP0017 | EBL1501EXA6 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-ebl1501exa6.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasf-m63j2v95osx5b6 |
| EP0017 | EBL1501A12 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-12.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98x-lyw1i31nzey13b |
| EP0017 | EBL1501EXA5 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-ebl1501exa5.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasb-m63izmbgt7pv0f |
| EP0017 | EBL1501EXA13 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-ebl1501exa13.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasd-m63j1liemnv7b7 |
| EP0017 | EBL1501A6 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-6.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98t-lr3wm333zuas5c |
| EP0017 | EBL1501EXA12 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-ebl1501exa12.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-m63j1aigq2ujf4 |
| EP0017 | EBL1501A7 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-7.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98o-lr3wm33418v8c4 |
| EP0017 | EBL1501EXA7 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-ebl1501exa7.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasf-m63j0w0k0n3f22 |
| EP0017 | EBL1501EXA8 | variant | `product.html?id=EP0017` | `images/products/belts/ebl-1501-a/ebl-1501-a-ebl1501exa8.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasi-m63j131vn49fcc |
| EP0034 | EBL 1501 B D11 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-bd11.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfbobhtj71 |
| EP0034 | EBL 1501 A D9 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-ad9.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lr45nfbo8oonb2 |
| EP0034 | EBL 1501 I D10 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-id10.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfboa3935f |
| EP0034 | EBL 1501 F D10 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-fd10.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfboa3935f |
| EP0034 | EBL 1501 B D10 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-bd10.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfboa3935f |
| EP0034 | EBL 1501 F D9 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-fd9.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lr45nfbo8oonb2 |
| EP0034 | EBL 1501 I D11 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-id11.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfbobhtj71 |
| EP0034 | EBL 1501 I D9 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-id9.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lr45nfbo8oonb2 |
| EP0034 | EBL 1501 B D9 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-bd9.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98v-lr45nfbo8oonb2 |
| EP0034 | EBL 1501 A D10 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-ad10.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfboa3935f |
| EP0034 | EBL 1501 A D11 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-ad11.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfbobhtj71 |
| EP0034 | EBL 1501 F D11 | variant | `product.html?id=EP0034` | `images/products/belts/ebl-1501/ebl-1501-fd11.jpg` | https://cf.shopee.com.my/file/my-11134207-7r98w-lr45nfbobhtj71 |
| EP0043 | EBL 001 D9 | variant | `product.html?id=EP0043` | `images/products/belts/ebl-001-1/ebl-001-1-d9.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-uqpl0un4objv58 |
| EP0043 | EBL 001 D10 | variant | `product.html?id=EP0043` | `images/products/belts/ebl-001-1/ebl-001-1-d10.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-rmm1f7w4objva7 |
| EP0043 | EBL 001 D11 | variant | `product.html?id=EP0043` | `images/products/belts/ebl-001-1/ebl-001-1-d11.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-7j135b44objvd1 |
| EP0051 | EBL 1506 F | variant | `product.html?id=EP0051` | `images/products/belts/ebl-1506/ebl-1506-f.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-ixmimk5fixiv76 |
| EP0051 | EBL 1506 L | variant | `product.html?id=EP0051` | `images/products/belts/ebl-1506/ebl-1506-l.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-qvykl3bgixiv4a |
| EP0051 | EBL 1506 R | variant | `product.html?id=EP0051` | `images/products/belts/ebl-1506/ebl-1506-r.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-lcx8tiigixiva7 |
| EP0051 | EBL 1506 W | variant | `product.html?id=EP0051` | `images/products/belts/ebl-1506/ebl-1506-w.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-hxesshngixiv77 |
| EP0051 | EBL 1506 A | variant | `product.html?id=EP0051` | `images/products/belts/ebl-1506/ebl-1506-a.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-yd71vh0eixivb5 |
| EP0051 | EBL 1506 B | variant | `product.html?id=EP0051` | `images/products/belts/ebl-1506/ebl-1506-b.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-e38u5exfixiv14 |
| EP0051 | EBL 1506 E | variant | `product.html?id=EP0051` | `images/products/belts/ebl-1506/ebl-1506-e.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-39gd7yqfixivef |
| EP0054 | EBL 001 D4 | variant | `product.html?id=EP0054` | `images/products/belts/ebl-001-2/ebl-001-2-d4.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-s3q7z7tolbjv98 |
| EP0054 | EBL 001 D5 | variant | `product.html?id=EP0054` | `images/products/belts/ebl-001-2/ebl-001-2-d5.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-p8rfuo8olbjv27 |
| EP0054 | EBL 001 D1 | variant | `product.html?id=EP0054` | `images/products/belts/ebl-001-2/ebl-001-2-d1.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-8yqk6bdnlbjvad |
| EP0054 | EBL 001 D2 | variant | `product.html?id=EP0054` | `images/products/belts/ebl-001-2/ebl-001-2-d2.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-am41dlmnlbjv98 |
| EP0054 | EBL 001 D3 | variant | `product.html?id=EP0054` | `images/products/belts/ebl-001-2/ebl-001-2-d3.jpg` | https://cf.shopee.com.my/file/sg-11134201-22100-11anv6dolbjvd3 |

## luggage — 30 missing

| Product | SKU | Slot | Page | Expected local file | Current Shopee URL |
|---|---|---|---|---|---|
| EP0008 | RY003FI3IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-i3in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rask-m4u0nb8a7a3v17 |
| EP0008 | RY003FI2IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-i2in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rask-m4u0nb8a7a3v17 |
| EP0008 | RY003FI20 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-i20.jpg` | https://cf.shopee.com.my/file/my-11134207-7rask-m4u0nb8a7a3v17 |
| EP0008 | RY003FE12IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-e12in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0myn6mc4r6f |
| EP0008 | RY003FV28 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-v28.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-m4u0nehxf49f0c |
| EP0008 | RY003FF3IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-f3in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-m4u0n1n48e0bad |
| EP0008 | RY003FW24 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-w24.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-m4u0niova8krc5 |
| EP0008 | RY003FA20 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-a20.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0o0ukpm4z37 |
| EP0008 | RY003FV24 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-v24.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-m4u0nehxf49f0c |
| EP0008 | RY003FF24 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-f24.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-m4u0n1n48e0bad |
| EP0008 | RY003FI28 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-i28.jpg` | https://cf.shopee.com.my/file/my-11134207-7rask-m4u0nb8a7a3v17 |
| EP0008 | RY003FW3IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-w3in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-m4u0niova8krc5 |
| EP0008 | RY003FE120 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-e120.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0myn6mc4r6f |
| EP0008 | RY003FV3IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-v3in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-m4u0nehxf49f0c |
| EP0008 | RY003FE124 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-e124.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0myn6mc4r6f |
| EP0008 | RY003FW20 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-w20.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-m4u0niova8krc5 |
| EP0008 | RY003FE128 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-e128.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0myn6mc4r6f |
| EP0008 | RY003FA2IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-a2in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0o0ukpm4z37 |
| EP0008 | RY003FF20 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-f20.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-m4u0n1n48e0bad |
| EP0008 | RY003FF2IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-f2in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-m4u0n1n48e0bad |
| EP0008 | RY003FA3IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-a3in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0o0ukpm4z37 |
| EP0008 | RY003FI24 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-i24.jpg` | https://cf.shopee.com.my/file/my-11134207-7rask-m4u0nb8a7a3v17 |
| EP0008 | RY003FV20 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-v20.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-m4u0nehxf49f0c |
| EP0008 | RY003FW28 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-w28.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-m4u0niova8krc5 |
| EP0008 | RY003FW2IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-w2in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasg-m4u0niova8krc5 |
| EP0008 | RY003FF28 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-f28.jpg` | https://cf.shopee.com.my/file/my-11134207-7rash-m4u0n1n48e0bad |
| EP0008 | RY003FA24 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-a24.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0o0ukpm4z37 |
| EP0008 | RY003FA28 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-a28.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0o0ukpm4z37 |
| EP0008 | RY003FV2IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-v2in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasl-m4u0nehxf49f0c |
| EP0008 | RY003FE13IN1 | variant | `product.html?id=EP0008` | `images/products/luggage/ry003f/ry003f-e13in1.jpg` | https://cf.shopee.com.my/file/my-11134207-7rasm-m4u0myn6mc4r6f |
