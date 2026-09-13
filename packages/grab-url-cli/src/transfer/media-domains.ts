/**
 * @file media-domains.ts
 * @description The domain allowlist that routes a URL to `yt-dlp` instead of the
 * plain fetch() downloader.
 *
 * Sites on this list serve a HTML player page at the URL a user copies, not the
 * media itself — fetching it directly saves a page of markup, so those targets
 * are handed to yt-dlp, which resolves the real stream. Everything else keeps
 * using the built-in HTTP downloader.
 *
 * Matching is by registrable suffix: an entry covers the host itself and every
 * subdomain of it (`youtube.com` matches `music.youtube.com`), which is why the
 * list also carries narrower entries like `areena.yle.fi` — those sites host
 * media on one subdomain only, and the parent domain should not be captured.
 */

// ─── Domain list ──────────────────────────────────────────────────────────────

/**
 * Hosts whose pages yt-dlp knows how to extract media from, sorted so additions
 * land as one-line diffs. An entry with no dot (e.g. `peertube`) is a software
 * marker rather than a domain — see {@link matchMediaDomain}.
 */
export const MEDIA_DOMAINS: readonly string[] = [
    '10play.com.au', '17.live', '1news.co.nz', '1tv.ru', '20min.ch', '23video.com',
    '247sports.com', '24tv.ua', '3cat.cat', '3qsdn.com', '3sat.de', '3speak.tv', '4tube.com',
    '56.com', '7plus.com.au', '9c9media.com', '9gag.com', '9news.com.au', '9now.com.au',
    'abc.net.au', 'abc7.com', 'abcnews.go.com', 'abema.tv', 'academicearth.org', 'acast.com',
    'acfun.cn', 'adobeconnect.com', 'aetv.com', 'agalega.com', 'aitube.kz', 'alibaba.com',
    'aliexpress.com', 'aljazeera.com', 'allocine.fr', 'allstar.gg', 'alphaporno.com',
    'altcensored.com', 'alura.com.br', 'amadeus.tv', 'amara.org', 'amazon.com', 'amazon.in',
    'amc.com', 'americastestkitchen.com', 'angel.com', 'animalplanet.com', 'antenna.gr',
    'anvato.net', 'aol.com', 'apa.at', 'aparat.com', 'appspot.com', 'arc-publishing.com',
    'archive.org', 'ardaudiothek.de', 'ardmediathek.de', 'areena.yle.fi', 'art19.com',
    'arte.sky.it', 'arte.tv', 'asobichannel.jp', 'asobistage.asobistore.jp', 'atresplayer.com',
    'atscaleconference.com', 'audi-mediacenter.com', 'audioboom.com', 'audiodraft.com',
    'audiomack.com', 'audius.co', 'azmedien.ch', 'baidu.com', 'banbye.com', 'bandcamp.com',
    'bandlab.com', 'banned.video', 'bbc.co.uk', 'bbc.com', 'bbcamerica.com', 'beacontv.com',
    'beatport.com', 'beeg.com', 'behindkink.com', 'berufe.tv', 'bet.com', 'bfi.org.uk',
    'bfmtv.com', 'bibil.tv', 'bigo.tv', 'bild.de', 'bilibili.com', 'bilibili.tv',
    'biobiochile.cl', 'biography.com', 'bit.ly', 'bitchute.com', 'bitmovin.com',
    'blackboard.com', 'bleacherreport.com', 'blerp.com', 'blogger.com', 'bloomberg.com',
    'bongacams.com', 'bostonglobe.com', 'box.com', 'boxcast.tv', 'bpb.de', 'br.de',
    'brainpop.com', 'breitbart.com', 'brightcove.com', 'brilliantpala.org', 'bundesliga.com',
    'bundestag.de', 'bunny.net', 'businessinsider.com', 'buzzfeed.com', 'byutv.org',
    'c-span.org', 'california.gov', 'cam4.com', 'camfm.co.uk', 'cammodels.com', 'camsoda.com',
    'canal1.com.co', 'canalalpha.ch', 'canalc2.tv', 'canalplus.com', 'canalsurmas.es',
    'caracoltv.com', 'cbc.ca', 'cbs.com', 'cbsnews.com', 'cbssports.com', 'cctv.com', 'cda.pl',
    'cellebrite.com', 'ceskatelevize.cz', 'cgtn.com', 'charlierose.com', 'chaturbate.com',
    'chilloutzone.net', 'chzzk.naver.com', 'cielotv.it', 'cinemax.com', 'cinetecamilano.it',
    'cineverse.com', 'ciscolive.com', 'cjsw.com', 'clip.rs', 'clipchamp.com',
    'cloudflarestream.com', 'cloudycdn.services', 'clubic.com', 'clyp.it', 'cnbc.com',
    'cnn.com', 'cnnindonesia.com', 'comedycentral.com', 'commonmistakes.net', 'condenast.com',
    'cookingchanneltv.com', 'corusent.com', 'coub.com', 'cozy.tv', 'cp24.com', 'cpac.ca',
    'cracked.com', 'craftsy.com', 'croatian.film', 'crooksandliars.com', 'crowdbunker.com',
    'crtvg.es', 'cts.com.tw', 'ctvnews.ca', 'cultureunplugged.com', 'curiositystream.com',
    'cybrary.it', 'd.tube', 'dacast.com', 'dagelijksekost.vrt.be', 'dailymail.co.uk',
    'dailymotion.com', 'dailywire.com', 'damtomo.com', 'dangalplay.com', 'daum.net',
    'daystar.com', 'dctp.tv', 'democracynow.org', 'destinationamerica.com', 'detik.com',
    'digitalconcerthall.com', 'digiteka.com', 'digiview.com', 'discogs.com',
    'discoveryplus.com', 'disney.com', 'dlive.tv', 'douyin.com', 'douyu.com', 'dplay.dk',
    'dr.dk', 'dropbox.com', 'dropout.tv', 'drtalks.com', 'drtuber.com', 'dumpert.nl',
    'duoplay.ee', 'dvtv.cz', 'dw.com', 'dzen.ru', 'ebaumsworld.com', 'ebay.com', 'egghead.io',
    'eggs.mu', 'elementor.com', 'elonet.finna.fi', 'elpais.com', 'eltrecetv.com.ar',
    'embedly.com', 'empflix.com', 'epicon.in', 'epidemicsound.com', 'eporner.com', 'erocast.me',
    'eroprofile.com', 'espn.com', 'espncricinfo.com', 'europarl.europa.eu', 'europeantour.com',
    'eurosport.com', 'euscreen.eu', 'expressen.se', 'facebook.com', 'fancode.com',
    'fathom.video', 'faulio.com', 'faz.net', 'fc-zenit.ru', 'fifa.com', 'filmarchiv.at',
    'filmon.com', 'filmweb.no', 'fivethirtyeight.com', 'flickr.com', 'floatplane.com',
    'foodnetwork.com', 'footyroom.com', 'formula1.com', 'fox.com', 'fox9.com', 'foxnews.com',
    'foxsports.com', 'fptplay.vn', 'francaisfacile.com', 'france.tv', 'franceinfo.fr',
    'freesound.org', 'freespeech.org', 'frontendmasters.com', 'funk.net', 'funker530.com',
    'fux.com', 'gab.com', 'gaia.com', 'gamedevtv.com', 'gamejolt.com', 'gamespot.com',
    'gamestar.de', 'gdcvault.com', 'gedidigital.it', 'gem.cbc.ca', 'genius.com', 'getcourse.ru',
    'gettr.com', 'giantbomb.com', 'glomex.com', 'gmanetwork.com', 'godtube.com', 'golem.de',
    'goodgame.ru', 'gopro.com', 'gotostage.com', 'graspop.be', 'gronkh.tv', 'groupon.com',
    'hbo.com', 'hearthis.at', 'heise.de', 'hellporno.com', 'hgtv.com', 'hidive.com',
    'history.com', 'hitrecord.org', 'hollywoodreporter.com', 'holodex.net', 'hotstar.com',
    'hrti.hrt.hr', 'huajiao.com', 'huffpost.com', 'hungama.com', 'huya.com', 'hypem.com',
    'idagio.com', 'iflix.com', 'ign.com', 'iheart.com', 'ilpost.it', 'iltalehti.fi', 'imdb.com',
    'imgur.com', 'ina.fr', 'inc.com', 'indavideo.hu', 'infoq.com', 'instagram.com',
    'internazionale.it', 'iprima.cz', 'iq.com', 'iqiyi.com', 'israelnationalnews.com',
    'itpro.tv', 'itv.com', 'ivi.ru', 'ivideon.com', 'ivoox.com', 'iwara.tv', 'ixigua.com',
    'jamendo.com', 'jeuxvideo.com', 'jiosaavn.com', 'joj.sk', 'jove.com', 'jstream.jp',
    'jtbc.co.kr', 'jwplayer.com', 'kakao.com', 'kaltura.com', 'kenh14.vn', 'khanacademy.org',
    'kick.com', 'kicker.de', 'kickstarter.com', 'kika.de', 'kinopoisk.ru', 'kommunetv.no',
    'kompas.com', 'ku6.com', 'kuwo.cn', 'la7.it', 'laracasts.com', 'last.fm', 'lbry.tv',
    'lci.fr', 'learning.oreilly.com', 'lecturio.com', 'lefigaro.fr', 'lego.com', 'lemonde.fr',
    'lequipe.fr', 'libsyn.com', 'likee.video', 'linkedin.com', 'liputan6.com',
    'listennotes.com', 'litv.tv', 'livestreamfails.com', 'loco.gg', 'loom.com',
    'lovehomeporn.com', 'lrt.lt', 'lsm.lv', 'magellantv.com', 'mail.ru', 'mainstreaming.tv',
    'mangomolo.com', 'manyvids.com', 'masters.com', 'matchtv.ru', 'mave.digital', 'mbn.co.kr',
    'mdr.de', 'medal.tv', 'media.ccc.de', 'mediaite.com', 'mediaklikk.hu', 'mediaset.it',
    'mediasite.com', 'medici.tv', 'megaphone.fm', 'meipai.com', 'mellowfan.com', 'melon.com',
    'metacritic.com', 'mewatch.sg', 'mgtv.com', 'microsoft.com', 'minds.com', 'mir24.tv',
    'mirrativ.com', 'mixch.tv', 'mixcloud.com', 'mixlr.com', 'mlb.com', 'mlssoccer.com',
    'mojevideo.sk', 'monstercat.com', 'motorsport.com', 'moviefap.com', 'moviepilot.de',
    'msn.com', 'mtv.com', 'mujrozhlas.cz', 'murrtube.net', 'muse.ai', 'musescore.com',
    'mux.com', 'mx3.ch', 'mxplayer.in', 'myspace.com', 'myspass.de', 'myvideo.ge',
    'myvidster.com', 'n-tv.de', 'n1info.rs', 'nascar.com', 'nationalgeographic.com',
    'naver.com', 'nba.com', 'nbc.com', 'nbcnews.com', 'nbcsports.com', 'ndr.de', 'ndtv.com',
    'nebula.tv', 'nest.com', 'netzkino.de', 'newgrounds.com', 'newspicks.com', 'nexx.cloud',
    'nfb.ca', 'nfhsnetwork.com', 'nfl.com', 'nhk.or.jp', 'nhl.com', 'nicochannel.jp',
    'nicovideo.jp', 'nintendo.com', 'nitter.net', 'nobelprize.org', 'noodlemagazine.com',
    'nos.nl', 'nova.bg', 'nowness.com', 'npo.nl', 'npr.org', 'nrk.no', 'nts.live', 'ntv.ru',
    'nuvid.com', 'nytimes.com', 'nzherald.co.nz', 'nzonscreen.com', 'nzz.ch', 'ocw.mit.edu',
    'odysee.com', 'ok.ru', 'olympics.com', 'omny.fm', 'on24.com', 'ondemandkorea.com',
    'onefootball.com', 'onet.pl', 'onet.tv', 'onsen.ag', 'orf.at', 'outsidetv.com',
    'packtpub.com', 'palcomp3.com', 'panopto.com', 'paramountpressexpress.com', 'parler.com',
    'parliamentlive.tv', 'patreon.com', 'pbs.org', 'pbskids.org', 'pearvideo.com', 'peertube',
    'peloton.com', 'pgatour.com', 'philharmoniedeparis.fr', 'phoenix.de', 'photobucket.com',
    'piapro.jp', 'picarto.tv', 'pinterest.com', 'play.tv', 'player.fm', 'playsuisse.ch',
    'playtvak.cz', 'pluralsight.com', 'pluto.tv', 'podbay.fm', 'podchaser.com', 'podomatic.com',
    'pokergo.com', 'polsatgo.pl', 'polskieradio.pl', 'popcorntimes.tv', 'pornhub.com',
    'pr0gramm.com', 'prankcast.com', 'presstv.ir', 'prx.org', 'puhutv.com', 'pyvideo.org',
    'q-dance.com', 'qingting.fm', 'qq.com', 'quantum-tv.com', 'r7.com', 'radiko.jp',
    'radiofrance.fr', 'radioradicale.it', 'rai.it', 'raiplay.it', 'raiplaysound.it',
    'raywenderlich.com', 'rctiplus.com', 'redbull.com', 'reddit.com', 'redgifs.com',
    'redtube.com', 'reuters.com', 'reverbnation.com', 'rinse.fm', 'rokfin.com',
    'roosterteeth.com', 'rottentomatoes.com', 'rt.com', 'rte.ie', 'rtl.lu', 'rtl.nl', 'rtp.pt',
    'rtve.es', 'rtvslo.si', 'rumble.com', 'ruptly.tv', 'rutube.ru', 'ruv.is', 's4c.cymru',
    'sangiin.go.jp', 'sapo.pt', 'sbs.co.kr', 'sbs.com.au', 'schooltv.nl', 'screen9.com',
    'screencast.com', 'screencastify.com', 'scrolller.com', 'sejm.gov.pl', 'senate.gov',
    'servustv.com', 'seznamzpravy.cz', 'shahid.mbc.net', 'sharepoint.com', 'shemaroome.com',
    'showroom-live.com', 'shugiintv.go.jp', 'sibnet.ru', 'simplecast.com', 'sina.com.cn',
    'skeb.jp', 'sky.it', 'skynews.com.au', 'skysports.com', 'slideshare.net', 'slideslive.com',
    'smotrim.ru', 'snapchat.com', 'sohu.com', 'sonyliv.com', 'soundcloud.com', 'soundgasm.net',
    'southpark.cc.com', 'southpark.de', 'spankbang.com', 'spiegel.de', 'spreaker.com',
    'sproutvideo.com', 'sr.de', 'stage-plus.com', 'steamcommunity.com', 'steampowered.com',
    'stream.cz', 'streamable.com', 'stripchat.com', 'substack.com', 'sunporno.com',
    'svtplay.se', 't-online.de', 't.me', 'taptap.cn', 'taptap.io', 'tass.ru', 'tbs.co.jp',
    'teachable.com', 'teamcoco.com', 'teamtreehouse.com', 'ted.com', 'tele13.cl', 'tele5.de',
    'telebruxelles.be', 'telecinco.es', 'telegram.org', 'telequebec.tv', 'telewebion.com',
    'tennistv.com', 'tf1.fr', 'theguardian.com', 'theintercept.com', 'theplatform.com',
    'thesun.co.uk', 'thisamericanlife.org', 'thisvid.com', 'tiktok.com', 'tlc.com', 'tmz.com',
    'tnaflix.com', 'toggo.de', 'tokfm.pl', 'toongoggles.com', 'tou.tv', 'toutiao.com',
    'travelchannel.com', 'trtworld.com', 'trueid.net', 'truthsocial.com', 'tubitv.com',
    'tumblr.com', 'tunein.com', 'tv.dfb.de', 'tv2.dk', 'tv2.no', 'tv2play.hu', 'tv4.se',
    'tv5monde.com', 'tv5unis.ca', 'tv8.it', 'tver.jp', 'tvigle.ru', 'tvo.org', 'tvp.pl',
    'twitch.tv', 'twitter.com', 'udemy.com', 'ufc.com', 'unistra.fr', 'unity.com',
    'universal-music.de', 'uol.com.br', 'uplynk.com', 'urplay.se', 'usanetwork.com',
    'usatoday.com', 'ustream.tv', 'vbox7.com', 'veo.co', 'vevo.com', 'vimeo.com', 'viu.com',
    'vk.com', 'vkplay.live', 'vocaroo.com', 'vod-platform.net', 'volej.tv', 'voxmedia.com',
    'vpro.nl', 'vrt.be', 'vtm.be', 'vtv.vn', 'walla.co.il', 'washingtonpost.com',
    'watchnrl.com', 'wdr.de', 'web.archive.org', 'webcaster.pro', 'webex.com',
    'webofstories.com', 'webtv.un.org', 'weibo.com', 'weverse.io', 'whyp.it', 'wikimedia.org',
    'wimbledon.com', 'wistia.com', 'worldstarhiphop.com', 'wsj.com', 'wwe.com', 'wyborcza.pl',
    'wykop.pl', 'x.com', 'xhamster.com', 'xiaohongshu.com', 'ximalaya.com', 'xinpianchang.com',
    'xnxx.com', 'xvideos.com', 'yahoo.com', 'yandex.ru', 'yappy.media', 'youku.com',
    'younow.com', 'youporn.com', 'youtu.be', 'youtube.com', 'zaiko.io', 'zattoo.com', 'zdf.de',
    'zhihu.com', 'zingmp3.vn', 'zoom.us', 'zype.com',
] as const;

// ─── Lookup tables ────────────────────────────────────────────────────────────

/** Dotted entries, for O(1) suffix lookups. */
const DOMAIN_SET: ReadonlySet<string> = new Set(MEDIA_DOMAINS.filter((d) => d.includes('.')));

/**
 * Dot-free entries. These name self-hosted software rather than one operator —
 * PeerTube runs on thousands of independent domains — so they match any host
 * that carries the word as part of a label (`peertube.tv`, `video.peertube.fr`).
 */
const MARKERS: readonly string[] = MEDIA_DOMAINS.filter((d) => !d.includes('.'));

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Extract a lowercase hostname from a target, or null when it is not an
 * http(s) URL (magnet URIs, local paths and sftp:// never reach yt-dlp).
 *
 * @param target - Raw CLI argument
 */
export function hostnameOf(target: string): string | null {
    if (!target) return null;
    try {
        const url = new URL(target.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.hostname.toLowerCase().replace(/\.$/, '');
    } catch {
        return null;
    }
}

/**
 * Return the {@link MEDIA_DOMAINS} entry a URL belongs to, or null when no
 * entry covers it.
 *
 * A dotted entry matches the host itself and any subdomain of it; the walk goes
 * from the most specific suffix outwards, so `areena.yle.fi` wins over a
 * hypothetical `yle.fi` entry. Dot-free entries match a host label instead.
 *
 * @param target - URL to classify
 */
export function matchMediaDomain(target: string): string | null {
    const host = hostnameOf(target);
    if (!host) return null;

    const labels = host.split('.');
    for (let i = 0; i < labels.length - 1; i++) {
        const suffix = labels.slice(i).join('.');
        if (DOMAIN_SET.has(suffix)) return suffix;
    }

    // Whole-host check too, so single-label hosts (an intranet mirror) still hit.
    if (DOMAIN_SET.has(host)) return host;

    for (const marker of MARKERS) {
        if (labels.some((label) => label.includes(marker))) return marker;
    }
    return null;
}

/** True when a URL should be handed to yt-dlp rather than fetched directly. */
export function isMediaDomain(target: string): boolean {
    return matchMediaDomain(target) !== null;
}
