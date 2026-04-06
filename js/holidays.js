// ==========================================
// 休診日表示システム - 青木内科クリニック
// ==========================================

// 休診日データを読み込む
async function loadHolidays() {
    try {
        const response = await fetch('data/holidays.json');
        if (!response.ok) {
            throw new Error('休診日データの読み込みに失敗しました');
        }
        const holidaysData = await response.json();
        return holidaysData;
    } catch (error) {
        console.error('Error loading holidays:', error);
        return [];
    }
}

// 日付をフォーマット
function formatHolidayDate(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
}

// 休診期間を判定して表示テキストを生成
function generateHolidayText(holiday) {
    const startFormatted = formatHolidayDate(holiday.startDate);
    const endFormatted = holiday.endDate ? formatHolidayDate(holiday.endDate) : null;
    const isSingleDay = !holiday.endDate || holiday.startDate === holiday.endDate;
    const period = isSingleDay ? startFormatted : `${startFormatted}～${endFormatted}`;
    
    let timeText = '';
    
    switch (holiday.type) {
        case 'morning':
            timeText = `${startFormatted}午前`;
            break;
        case 'afternoon':
            timeText = `${startFormatted}午後`;
            break;
        case 'partial':
            // 時間指定（「開院」「閉院」の特殊値に対応）
            {
                const st = holiday.startTime;
                const et = holiday.endTime;
                const startLabel = st === '開院' ? '開院' : st;
                const endLabel = et === '閉院' ? '閉院' : et;
                
                if (startLabel && endLabel) {
                    timeText = `${period} ${startLabel}～${endLabel}`;
                } else if (startLabel) {
                    timeText = `${period} ${startLabel}～`;
                } else if (endLabel) {
                    timeText = `${period} ～${endLabel}`;
                } else {
                    timeText = period;
                }
            }
            break;
        case 'full':
        default:
            // 終日休診
            timeText = `${period}（終日）`;
            break;
    }
    
    return {
        period: timeText,
        title: holiday.title,
        description: holiday.description,
        important: holiday.important
    };
}

// 現在表示すべき休診日をフィルタリング
function getActiveHolidays(holidays) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return holidays.filter(holiday => {
        const displayStart = new Date(holiday.displayStartDate);
        displayStart.setHours(0, 0, 0, 0);
        
        // endDateがnullの場合はstartDateを使用（1日のみの休診日）
        const endDateString = holiday.endDate || holiday.startDate;
        const holidayEnd = new Date(endDateString);
        holidayEnd.setHours(23, 59, 59, 999);
        
        // 表示開始日以降、かつ休診終了日より前
        return today >= displayStart && today <= holidayEnd;
    });
}

// トップページに休診日を表示
async function displayHolidaysOnHome() {
    const holidayContainer = document.getElementById('holidayNotice');
    if (!holidayContainer) return;
    
    const holidays = await loadHolidays();
    const activeHolidays = getActiveHolidays(holidays);
    
    if (activeHolidays.length === 0) {
        holidayContainer.style.display = 'none';
        return;
    }
    
    let html = '';
    activeHolidays.forEach(holiday => {
        const info = generateHolidayText(holiday);
        const alertClass = info.important ? 'alert-danger' : 'alert-warning';
        
        html += `
            <div class="alert ${alertClass} mb-3">
                <h5 class="alert-heading">
                    <i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
                    ${info.title}
                </h5>
                <p class="mb-2"><strong>${info.period}</strong></p>
                <p class="mb-0">${info.description}</p>
            </div>
        `;
    });
    
    holidayContainer.innerHTML = html;
    holidayContainer.style.display = 'block';
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('holidayNotice')) {
        displayHolidaysOnHome();
    }
});
