// ==========================================
// 予防接種情報管理システム - 青木内科クリニック
// ==========================================

// 予防接種データを読み込む
async function loadVaccinations() {
    try {
        const response = await fetch('data/vaccinations.json');
        if (!response.ok) {
            throw new Error('予防接種データの読み込みに失敗しました');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading vaccinations:', error);
        return null;
    }
}

// 日付をフォーマット（YYYY年MM月DD日）
function formatDateJapanese(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

// 現在表示すべきワクチンをフィルタリング（holidays.jsと同様の仕様）
function getActiveVaccines(vaccines) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return vaccines.filter(vaccine => {
        // displayStartDate/displayEndDate が null の場合は常に表示
        if (!vaccine.displayStartDate && !vaccine.displayEndDate) {
            return true;
        }

        if (vaccine.displayStartDate && !vaccine.displayEndDate) {
            const displayStart = new Date(vaccine.displayStartDate);
            displayStart.setHours(0, 0, 0, 0);
            return today >= displayStart;
        }

        if (!vaccine.displayStartDate && vaccine.displayEndDate) {
            const displayEnd = new Date(vaccine.displayEndDate);
            displayEnd.setHours(23, 59, 59, 999);
            return today <= displayEnd;
        }

        const displayStart = new Date(vaccine.displayStartDate);
        displayStart.setHours(0, 0, 0, 0);

        const displayEnd = new Date(vaccine.displayEndDate);
        displayEnd.setHours(23, 59, 59, 999);

        // 表示開始日以降、かつ表示終了日以前
        return today >= displayStart && today <= displayEnd;
    });
}

// 価格をフォーマット（カンマ区切り）
function formatPrice(price) {
    return price.toLocaleString('ja-JP');
}

// 目次（ワクチン一覧）を生成
function generateVaccineIndex(vaccines) {
    if (vaccines.length === 0) {
        return '';
    }

    let html = `
        <div class="card shadow-sm border-0 mb-5">
            <div class="card-header bg-success text-white">
                <h3 class="mb-0">
                    <i class="bi bi-list-ul" aria-hidden="true"></i> 取り扱いワクチン一覧
                </h3>
            </div>
            <div class="card-body p-4">
                <div class="list-group list-group-flush">
    `;

    vaccines.forEach(vaccine => {
        html += `
            <a href="#vaccine-${vaccine.id}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <span>
                    <i class="${vaccine.icon} text-success me-2" aria-hidden="true"></i>
                    ${vaccine.name}
                </span>
                <span class="badge bg-secondary">${vaccine.category}</span>
            </a>
        `;
    });

    html += `
                </div>
            </div>
        </div>
    `;

    return html;
}

// 価格カテゴリーを生成
function generatePriceCategories(priceCategories) {
    // 価格情報がない場合はお問い合わせメッセージを表示
    if (!priceCategories || priceCategories.length === 0) {
        return `
            <div class="alert alert-secondary mb-0">
                <i class="bi bi-telephone-fill me-2" aria-hidden="true"></i>
                料金についてはお電話にてお問い合わせください。
            </div>
        `;
    }

    let html = '';

    priceCategories.forEach((category, index) => {
        if (index > 0) {
            html += '<hr class="my-4">';
        }

        // 対象地域がある場合
        if (category.targetArea && category.targetArea.length > 0) {
            html += `
                <h4 class="text-success mb-3">
                    <i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ${category.targetArea.join('・')}にお住まいの方
                </h4>
            `;
        }

        html += `
            <h4 class="text-success mb-3">
                <i class="${category.icon}" aria-hidden="true"></i> ${category.ageCondition}
            </h4>
            <div class="table-responsive">
                <table class="table table-bordered vaccination-table">
                    <tbody>
                        <tr>
                            <th class="bg-light" style="width: 30%;">料金</th>
                            <td>
                                <span class="price">${formatPrice(category.price)}円</span>
                                ${category.priceNote ? `<br><small class="text-muted">${category.priceNote}</small>` : ''}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    });

    return html;
}

// ワクチン詳細カードを生成
function generateVaccineCard(vaccine) {
    let html = `
        <div class="card shadow mb-5 border border-1" style="border-color: #dee2e6 !important; border-top: 3px solid #198754 !important;" id="vaccine-${vaccine.id}">
            <div class="card-header bg-success text-white">
                <h3 class="mb-0">
                    <i class="${vaccine.icon}" aria-hidden="true"></i> ${vaccine.name}
                </h3>
            </div>
            <div class="card-body p-4">
    `;

    // 説明文
    if (vaccine.description) {
        html += `<p class="mb-4">${vaccine.description}</p>`;
    }

    // 予約が必要な場合
    if (vaccine.requiresReservation) {
        html += `
            <div class="alert alert-info mb-4">
                <h5 class="alert-heading">
                    <i class="bi bi-calendar-check-fill me-2" aria-hidden="true"></i>予約について
                </h5>
                <p class="mb-0"><strong>${vaccine.reservationNote}</strong></p>
            </div>
        `;
    }

    // 年齢制限がある場合
    if (vaccine.ageRestriction && vaccine.ageRestriction.note) {
        html += `
            <div class="alert alert-warning mb-4">
                <strong><i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>${vaccine.ageRestriction.note}</strong>
            </div>
        `;
    }

    // 価格カテゴリー
    html += generatePriceCategories(vaccine.priceCategories);

    // 注意事項
    if (vaccine.notes && vaccine.notes.length > 0) {
        html += `
            <div class="mt-4 p-3 bg-light rounded">
                <h5 class="text-muted mb-2">
                    <i class="bi bi-info-circle-fill me-2" aria-hidden="true"></i>備考
                </h5>
                <ul class="mb-0 small">
        `;
        vaccine.notes.forEach(note => {
            html += `<li>${note}</li>`;
        });
        html += `
                </ul>
            </div>
        `;
    }

    // 詳細ページへのリンク
    if (vaccine.detailPage) {
        html += `
            <div class="text-center mt-4">
                <a href="${vaccine.detailPage}" class="btn btn-success btn-lg">
                    <i class="bi bi-arrow-right-circle me-2" aria-hidden="true"></i>${vaccine.name}の詳細ページへ
                </a>
            </div>
        `;
    }

    // 持ち物
    if (vaccine.bringItems && vaccine.bringItems.length > 0) {
        html += `
            <div class="mt-4 p-3 border rounded">
                <h5 class="text-success mb-2">
                    <i class="bi bi-bag-check-fill me-2" aria-hidden="true"></i>接種時にお持ちいただくもの
                </h5>
                <ul class="mb-0 small">
        `;
        vaccine.bringItems.forEach(item => {
            html += `<li>${item}</li>`;
        });
        html += `
                </ul>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// 価格に関する注意事項を生成
function generatePriceDisclaimer(lastUpdated, priceDisclaimer) {
    return `
        <div class="alert alert-warning mb-5">
            <h5 class="alert-heading">
                <i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>価格に関するご注意
            </h5>
            <p class="mb-2"><strong>最終更新日：${formatDateJapanese(lastUpdated)}</strong></p>
            <p class="mb-0">${priceDisclaimer}</p>
        </div>
    `;
}

// 接種スケジュールに関する注意を生成
function generateScheduleNotice(scheduleNotice, officialLinks) {
    let linksHtml = '';
    if (officialLinks && officialLinks.length > 0) {
        linksHtml = '<div class="mt-3">';
        officialLinks.forEach(link => {
            linksHtml += `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm me-2 mb-2">
                    <i class="bi bi-box-arrow-up-right me-1" aria-hidden="true"></i>${link.label}
                </a>
            `;
        });
        linksHtml += '</div>';
    }

    return `
        <div class="card shadow-sm border-0 mb-5">
            <div class="card-body p-4">
                <h4 class="text-success mb-3">
                    <i class="bi bi-calendar-event-fill" aria-hidden="true"></i> 接種スケジュールについて
                </h4>
                <p class="mb-0">${scheduleNotice}</p>
                ${linksHtml}
            </div>
        </div>
    `;
}

// 予防接種ページを表示
async function displayVaccinations() {
    const container = document.getElementById('vaccinationContainer');
    if (!container) return;

    const data = await loadVaccinations();

    if (!data || !data.vaccines) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-circle text-muted" style="font-size: 3rem;" aria-hidden="true"></i>
                <p class="text-muted mt-3">予防接種情報の読み込みに失敗しました。</p>
            </div>
        `;
        return;
    }

    // 表示期間内のワクチンをフィルタリング
    const activeVaccines = getActiveVaccines(data.vaccines);

    // 表示順でソート
    activeVaccines.sort((a, b) => a.order - b.order);

    let html = '';

    // 価格に関する注意事項
    html += generatePriceDisclaimer(data.lastUpdated, data.priceDisclaimer);

    // 接種スケジュールに関する注意
    html += generateScheduleNotice(data.scheduleNotice, data.officialLinks);

    // ワクチン一覧がない場合
    if (activeVaccines.length === 0) {
        html += `
            <div class="card shadow-sm border-0 mb-5">
                <div class="card-body p-4 text-center">
                    <i class="bi bi-info-circle text-muted" style="font-size: 3rem;" aria-hidden="true"></i>
                    <p class="text-muted mt-3">現在、予防接種の取り扱いはございません。</p>
                    <p class="text-muted">詳しくはお電話にてお問い合わせください。</p>
                </div>
            </div>
        `;
    } else {
        // 目次（ワクチン一覧）
        html += generateVaccineIndex(activeVaccines);

        // 各ワクチンの詳細
        activeVaccines.forEach(vaccine => {
            html += generateVaccineCard(vaccine);
        });
    }

    container.innerHTML = html;
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function () {
    displayVaccinations();
});
