import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_URL, canonicalUrl } from './jsonLd';

interface SEOHeadProps {
  /** Заголовок страницы (с ключевыми словами). К нему добавляется «| debiut». */
  title: string;
  /** Продающее метаописание, до ~160 символов. */
  description: string;
  /** Релевантные ключевые слова (через запятую или массив). */
  keywords?: string | string[];
  /** Канонический путь (относительный, напр. '/puzzles') — защита от дублей. */
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogTitle?: string;
  ogDescription?: string;
  /** Один или несколько объектов JSON-LD (Schema.org). */
  jsonLd?: object | object[];
  /** Не индексировать (приватные/служебные страницы). */
  noindex?: boolean;
}

const DEFAULT_OG_IMAGE = `${SITE_URL}/images/chess-cinematic-lg.jpg`;

/**
 * Универсальные SEO-теги <head>: title/description/keywords, canonical, Open Graph + Twitter Card
 * (красивое превью при шеринге в Telegram/WhatsApp/VK/Twitter) и микроразметка Schema.org (JSON-LD).
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title, description, keywords, canonicalPath, ogImage, ogType = 'website', ogTitle, ogDescription, jsonLd, noindex,
}) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | debiut`;
  const canonical = canonicalPath ? canonicalUrl(canonicalPath) : undefined;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const kw = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {kw && <meta name="keywords" content={kw} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (Telegram, WhatsApp, VK, Facebook) */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={image} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:locale" content="ru_RU" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={image} />

      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
