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
    if (!r.ok) throw new Error('无法加载日期列表');
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
</script>

<template>
  <div class="container">
    <header class="header">
      <h1>📰 AI 博客每日精选</h1>
      <p class="muted">来自 Karpathy 推荐的顶级技术博客，AI 精选</p>
      <div v-if="dates.length" class="date-picker">
        <label for="date">选择日期：</label>
        <select id="date" v-model="selectedDate">
          <option v-for="d in dates" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading" class="muted">加载中…</p>

    <template v-else-if="digest">
      <section v-if="digest.highlights" class="card">
        <h2>📝 今日看点</h2>
        <p class="highlights">{{ digest.highlights }}</p>
      </section>

      <section v-if="top3.length" class="card">
        <h2>🏆 今日必读</h2>
        <article v-for="(a, i) in top3" :key="a.link" class="top-item">
          <span class="medal">{{ ['🥇', '🥈', '🥉'][i] }}</span>
          <h3><a :href="a.link" target="_blank" rel="noopener">{{ a.titleZh || a.title }}</a></h3>
          <p class="meta muted">
            <a :href="a.link" target="_blank" rel="noopener">{{ a.title }}</a>
            — {{ a.sourceName }} · {{ humanTime(a.pubDate) }}
            · {{ CATEGORY_META[a.category].emoji }} {{ CATEGORY_META[a.category].label }}
          </p>
          <p class="summary">{{ a.summary }}</p>
          <p v-if="a.reason" class="reason">💡 {{ a.reason }}</p>
          <p v-if="a.keywords?.length" class="muted">🏷️ {{ a.keywords.join(', ') }}</p>
        </article>
      </section>

      <section class="card stats">
        <h2>📊 数据概览</h2>
        <table>
          <tr><th>扫描源</th><th>抓取文章</th><th>时间范围</th><th>精选</th></tr>
          <tr>
            <td>{{ digest.stats.successFeeds }}/{{ digest.stats.totalFeeds }}</td>
            <td>{{ digest.stats.totalArticles }} → {{ digest.stats.filteredArticles }} 篇</td>
            <td>{{ digest.stats.hours }}h</td>
            <td><strong>{{ digest.stats.selectedCount }} 篇</strong></td>
          </tr>
        </table>
      </section>

      <section v-for="[catId, articles] in byCategory" :key="catId" class="card">
        <h2>{{ CATEGORY_META[catId].emoji }} {{ CATEGORY_META[catId].label }}</h2>
        <article v-for="a in articles" :key="a.link" class="article-item">
          <h3><a :href="a.link" target="_blank" rel="noopener">{{ a.titleZh || a.title }}</a></h3>
          <p class="meta muted">
            <a :href="a.link" target="_blank" rel="noopener">{{ a.title }}</a>
            — {{ a.sourceName }} · {{ humanTime(a.pubDate) }}
            · ⭐ {{ a.scoreBreakdown.relevance + a.scoreBreakdown.quality + a.scoreBreakdown.timeliness }}/30
          </p>
          <p class="summary">{{ a.summary }}</p>
          <p v-if="a.keywords?.length" class="muted">🏷️ {{ a.keywords.join(', ') }}</p>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.header { margin-bottom: 1.5rem; }
.header h1 { font-size: 1.75rem; margin: 0 0 0.25rem 0; }
.date-picker { margin-top: 0.75rem; }
.date-picker select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 1rem;
}
.error { color: #f85149; }
.highlights { white-space: pre-wrap; margin: 0; }
.top-item, .article-item { margin-bottom: 1.25rem; }
.top-item:last-child, .article-item:last-child { margin-bottom: 0; }
.medal { margin-right: 0.25rem; }
.top-item h3, .article-item h3 { font-size: 1.1rem; margin: 0 0 0.25rem 0; }
.meta { margin: 0 0 0.5rem 0; }
.summary { margin: 0.5rem 0; opacity: 0.95; }
.reason { margin: 0.5rem 0; font-size: 0.95em; }
.stats table { width: 100%; border-collapse: collapse; }
.stats th, .stats td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); }
.stats th { color: var(--muted); font-weight: 500; }
</style>
