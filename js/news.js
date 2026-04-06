// ==========================================
// お知らせ機能 - 青木内科クリニック
// ==========================================

// お知らせデータを読み込む
async function loadNews() {
    try {
        const response = await fetch('data/news.json');
        if (!response.ok) {
            throw new Error('お知らせの読み込みに失敗しました');
        }
        const newsData = await response.json();
        return newsData;
    } catch (error) {
        console.error('Error loading news:', error);
        return [];
    }
}

// 日付をフォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// トップページ用：最新のお知らせを表示（最大3件）
async function displayNewsOnHome() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;

    const newsData = await loadNews();
    
    if (newsData.length === 0) {
        newsContainer.innerHTML = '<p class="text-muted">現在、お知らせはありません。</p>';
        return;
    }

    // 日付で降順ソート
    newsData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 最新3件のみ表示
    const latestNews = newsData.slice(0, 3);

    let html = '<div class="list-group">';
    latestNews.forEach(news => {
        const categoryBadge = news.category ? `<span class="badge bg-success me-2">${news.category}</span>` : '';
        const newsUrl = news.link || 'news.html';
        
        html += `
            <a href="${newsUrl}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
                <div class="flex-grow-1">
                    <span class="text-muted small me-3">
                        <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>${formatDate(news.date)}
                    </span>
                    ${categoryBadge}
                    <span class="news-title">${news.title}</span>
                </div>
                <i class="bi bi-chevron-right text-muted" aria-hidden="true"></i>
            </a>
        `;
    });
    html += '</div>';

    html += `
        <div class="text-center mt-3">
            <a href="news.html" class="btn btn-success btn-sm">
                <i class="bi bi-list-ul" aria-hidden="true"></i> すべてのお知らせを見る
            </a>
        </div>
    `;

    newsContainer.innerHTML = html;
}

// お知らせページ用：すべてのお知らせを表示
async function displayAllNews() {
    const newsList = document.getElementById('newsList');
    if (!newsList) return;

    const newsData = await loadNews();
    
    if (newsData.length === 0) {
        newsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-info-circle text-muted" style="font-size: 3rem;" aria-hidden="true"></i>
                <p class="text-muted mt-3">現在、お知らせはありません。</p>
            </div>
        `;
        return;
    }

    // 日付で降順ソート
    newsData.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    newsData.forEach(news => {
        const isImportant = news.important ? 'border-success' : 'border-secondary';
        const categoryBadge = news.category ? `<span class="badge bg-success">${news.category}</span>` : '';
        // お知らせページでは詳細文（detail）を表示、なければsummaryまたはcontentを表示
        const displayText = news.detail || news.content || news.summary;
        // 改行を<br>タグに変換
        const formattedText = displayText.replace(/\n/g, '<br>');
        
        html += `
            <div class="card mb-4 shadow-sm border-start border-3 ${isImportant}">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <span class="text-muted me-3">
                                <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>${formatDate(news.date)}
                            </span>
                            ${categoryBadge}
                        </div>
                    </div>
                    <h4 class="card-title text-success mb-3">${news.title}</h4>
                    <div class="card-text">${formattedText}</div>
                    ${news.link ? `
                        <div class="mt-3">
                            <a href="${news.link}" class="btn btn-success">
                                <i class="bi bi-arrow-right-circle" aria-hidden="true"></i> ${news.linkText || '詳細を見る'}
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    newsList.innerHTML = html;
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
    // トップページの場合
    if (document.getElementById('newsContainer')) {
        displayNewsOnHome();
    }
    
    // お知らせページの場合
    if (document.getElementById('newsList')) {
        displayAllNews();
    }
});
