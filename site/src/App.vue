<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { DigestJson } from './types';
import { CATEGORY_META } from './types';
import type { CategoryId } from './types';

const BASE = './digest';

const dates = ref<string[]>([]);
const selectedDate = ref<string>('');
const digest = ref<DigestJson | null>(null);
const loading = ref(false);
const error = ref('');

const loadDates = async () => {
  try {
    const r = await fetch(`${BASE}/index.json`);
    if (!r.ok) {
      if (r.status === 404) throw new Error('no_data');
      throw new Error('无法加载日期列表');
    }
    dates.value = await r.json();
    if (dates.value.length && !selectedDate.value) selectedDate.value = dates.value[0];
  } catch (e) {
    error.value = (e as Error).message;
  }
};

const loadDigest = async () => {
  if (!selectedDate.value) return;
  loading.value = true;
  error.value = '';
  try {
    const r = await fetch(`${BASE}/${selectedDate.value}.json`);
    if (!r.ok) throw new Error('该日期的日报不存在或加载失败');
    digest.value = await r.json();
  } catch (e) {
    error.value = (e as Error).message;
    digest.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(loadDates);
watch(selectedDate, loadDigest, { immediate: true });

const top3 = computed(() => digest.value?.articles.slice(0, 3) ?? []);
const byCategory = computed(() => {
  const d = digest.value;
  if (!d) return [];
  const map = new Map<CategoryId, DigestJson['articles']>();
  for (const a of d.articles) {
    const list = map.get(a.category) ?? [];
    list.push(a);
    map.set(a.category, list);
  }
  return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
});

function humanTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (h < 24) return `${h} 小时前`;
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN');
}

const topBadgeClass = ['gold', 'silver', 'bronze'] as const;
const topBadgeNum = ['1', '2', '3'] as const;
</script>

<template>
  <div class="container">
    <header class="page-header">
      <h1 class="brand">AI 博客每日精选</h1>
      <p class="tagline">来自 Karpathy 推荐的顶级技术博客，AI 精选</p>
      <div v-if="dates.length" class="date-picker-wrap">
        <label for="date">选择日期</label>
        <select id="date" v-model="selectedDate" aria-label="选择日报日期">
          <option v-for="d in dates" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
    </header>

    <div v-if="error" class="error-box" role="alert">
      <template v-if="error === 'no_data'">
        暂无日报数据。请先在 GitHub 仓库的 <strong>Actions</strong> 中手动运行「Daily Digest to OSS」生成首期日报；或等待每日定时任务（北京时间 23:00）自动生成。
      </template>
      <template v-else>{{ error }}</template>
    </div>
    <p v-else-if="loading" class="loading-dots" aria-live="polite">加载中</p>

    <template v-else-if="digest">
      <section v-if="digest.highlights" class="section" aria-labelledby="section-highlights">
        <h2 id="section-highlights" class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
          今日看点
        </h2>
        <div class="highlights-callout">
          <p class="highlights-text">{{ digest.highlights }}</p>
        </div>
      </section>

      <section v-if="top3.length" class="section" aria-labelledby="section-top">
        <h2 id="section-top" class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0V13.5m0 5.25v3.75m0-3.75h-9m-1.5 0V6.75m0 3.75v-3m0 3.75h9M6.75 6.75h.75v-.75h-.75v.75zM6.75 3v.75H6V3h.75zm1.5 0v.75h-.75V3h.75zM3.75 15h.75v.75h-.75V15zm0 3h.75v.75h-.75V18zm0-3h.75v.75h-.75V15zm0 3h.75v.75h-.75V18z" /></svg>
          今日必读
        </h2>
        <div class="card">
          <a v-for="(a, i) in top3" :key="a.link" :href="a.link" target="_blank" rel="noopener noreferrer" class="card-article">
            <span :class="['top-badge', topBadgeClass[i]]" aria-hidden="true">{{ topBadgeNum[i] }}</span>
            <div class="article-body">
              <h3 class="article-title">{{ a.titleZh || a.title }}</h3>
              <p class="article-meta">
                <a :href="a.link" target="_blank" rel="noopener noreferrer" @click.stop>{{ a.title }}</a>
                — {{ a.sourceName }} · {{ humanTime(a.pubDate) }}
                · {{ CATEGORY_META[a.category].label }}
              </p>
              <div class="summary-block">
                <span class="summary-label">中文摘要</span>
                <p class="summary">{{ a.summary }}</p>
              </div>
              <p v-if="a.reason" class="reason-line">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-inline" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v3.75m-9.303-3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
                {{ a.reason }}
              </p>
              <p v-if="a.keywords?.length" class="keywords-line">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-inline" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                {{ a.keywords.join(', ') }}
              </p>
            </div>
          </a>
        </div>
      </section>

      <section class="section" aria-labelledby="section-stats">
        <h2 id="section-stats" class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
          数据概览
        </h2>
        <div class="stats-strip">
          <span class="stat-pill"><strong>{{ digest.stats.successFeeds }}</strong>/{{ digest.stats.totalFeeds }} 扫描源</span>
          <span class="stat-pill"><strong>{{ digest.stats.totalArticles }}</strong> → <strong>{{ digest.stats.filteredArticles }}</strong> 篇</span>
          <span class="stat-pill"><strong>{{ digest.stats.hours }}h</strong> 时间范围</span>
          <span class="stat-pill"><strong>{{ digest.stats.selectedCount }}</strong> 篇精选</span>
        </div>
      </section>

      <section v-for="[catId, articles] in byCategory" :key="catId" class="section" :aria-labelledby="`section-${catId}`">
        <h2 :id="`section-${catId}`" class="section-title">
          <!-- Heroicons 24 outline per category (no emoji) -->
          <svg v-if="catId === 'ai-ml'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>
          <svg v-else-if="catId === 'security'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          <svg v-else-if="catId === 'engineering'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-1.5 0H3M4.5 12H3m9 0h-1.5m0 0H12m-1.5 0H3M4.5 12h1.5m0 0H12m0 0h1.5m0 0H3" /></svg>
          <svg v-else-if="catId === 'tools'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.47-.646.106-1.558-.753-1.558H3a.75.75 0 00-.75.75v4.128c0 .859.912 1.224 1.558.753l3.03-2.496" /></svg>
          <svg v-else-if="catId === 'opinion'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51a12.5 12.5 0 011.5 6.75m0 0l-3-3m3 3l3-3m-8.25 6a12.5 12.5 0 01-1.5 6.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          {{ CATEGORY_META[catId].label }}
        </h2>
        <div class="card">
          <a v-for="a in articles" :key="a.link" :href="a.link" target="_blank" rel="noopener noreferrer" class="card-article">
            <div class="article-body">
              <h3 class="article-title">{{ a.titleZh || a.title }}</h3>
              <p class="article-meta">
                <a :href="a.link" target="_blank" rel="noopener noreferrer" @click.stop>{{ a.title }}</a>
                — {{ a.sourceName }} · {{ humanTime(a.pubDate) }}
                · {{ a.scoreBreakdown.relevance + a.scoreBreakdown.quality + a.scoreBreakdown.timeliness }}/30 分
              </p>
              <div class="summary-block">
                <span class="summary-label">中文摘要</span>
                <p class="summary">{{ a.summary }}</p>
              </div>
              <p v-if="a.keywords?.length" class="keywords-line">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-inline" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                {{ a.keywords.join(', ') }}
              </p>
            </div>
          </a>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.icon { width: 1.25rem; height: 1.25rem; flex-shrink: 0; }
.icon-inline { width: 1rem; height: 1rem; vertical-align: -0.15em; margin-right: 0.25rem; display: inline-block; }
.card-article { text-decoration: none; color: inherit; }
.card-article .article-meta a { color: var(--text-muted); }
.card-article .article-meta a:hover { color: var(--accent); }
</style>
