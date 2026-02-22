export type CategoryId = 'ai-ml' | 'security' | 'engineering' | 'tools' | 'opinion' | 'other';

export interface DigestArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  score: number;
  scoreBreakdown: { relevance: number; quality: number; timeliness: number };
  category: CategoryId;
  keywords: string[];
  titleZh: string;
  summary: string;
  reason: string;
}

export interface DigestJson {
  date: string;
  highlights: string;
  stats: {
    totalFeeds: number;
    successFeeds: number;
    totalArticles: number;
    filteredArticles: number;
    hours: number;
    lang: string;
    selectedCount: number;
  };
  articles: DigestArticle[];
}

export const CATEGORY_META: Record<CategoryId, { emoji: string; label: string }> = {
  'ai-ml': { emoji: '🤖', label: 'AI / ML' },
  'security': { emoji: '🔒', label: '安全' },
  'engineering': { emoji: '⚙️', label: '工程' },
  'tools': { emoji: '🛠', label: '工具 / 开源' },
  'opinion': { emoji: '💡', label: '观点 / 杂谈' },
  'other': { emoji: '📝', label: '其他' },
};
