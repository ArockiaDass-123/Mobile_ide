/**
 * Web Search Service (Client & Backend Bridge)
 * Fetches instant web search results from DuckDuckGo / Wikipedia API
 * to inject as real-time grounding context for any model (Ollama or Cloud).
 */

export async function searchWeb(query) {
  try {
    const encoded = encodeURIComponent(query);
    // Instant Answer API via DuckDuckGo
    const ddgUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(ddgUrl);
    if (!response.ok) return null;

    const data = await response.json();
    let snippets = [];

    if (data.AbstractText) {
      snippets.push(`**${data.Heading || 'Summary'}:** ${data.AbstractText} (Source: ${data.AbstractURL})`);
    }

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 4).forEach((topic) => {
        if (topic.Text && topic.FirstURL) {
          snippets.push(`- ${topic.Text} (${topic.FirstURL})`);
        }
      });
    }

    if (snippets.length > 0) {
      return snippets.join('\n\n');
    }

    // Fallback to Wikipedia REST summary API
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.extract) {
        return `**${wikiData.title}**: ${wikiData.extract}\nSource: ${wikiData.content_urls?.desktop?.page || 'Wikipedia'}`;
      }
    }

    return null;
  } catch (err) {
    console.warn('Web search failed:', err);
    return null;
  }
}
