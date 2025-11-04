import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportScheduleOptions {
  studentName?: string;
  className?: string;
  teacherName?: string;
  requestedBy?: 'student' | 'teacher';
}

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 0, label: 'Pazartesi' },
  { value: 1, label: 'Salı' },
  { value: 2, label: 'Çarşamba' },
  { value: 3, label: 'Perşembe' },
  { value: 4, label: 'Cuma' },
  { value: 5, label: 'Cumartesi' },
  { value: 6, label: 'Pazar' }
];

const DAY_COLORS = [
  '#6366F1',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6'
];

const textOrFallback = (value?: string | null) => value?.toString().trim() || '';

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('tr-TR');
  } catch {
    return value;
  }
};

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9ıiğüşöç\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'calisma-programi';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildMetaChip = (label: string, value: string) => {
  if (!value) return '';
  return `
    <div style="
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.08);
      color: #312E81;
      font-size: 12px;
      font-weight: 500;
      margin-right: 6px;
      margin-bottom: 6px;
    ">
      <span style="font-weight: 600;">${escapeHtml(label)}:</span>
      <span>${escapeHtml(value)}</span>
    </div>
  `;
};

const createScheduleHtml = (schedule: any, options: ExportScheduleOptions) => {
  const title = textOrFallback(schedule?.title) || 'Haftalık Çalışma Programı';
  const weekRange =
    schedule?.week_start_date && schedule?.week_end_date
      ? `${formatDate(schedule.week_start_date)} - ${formatDate(schedule.week_end_date)}`
      : '';
  const studentName = textOrFallback(options.studentName || schedule?.student?.profile?.full_name);
  const className = textOrFallback(options.className || schedule?.class?.class_name);
  const teacherName = textOrFallback(options.teacherName || schedule?.teacher?.full_name);

  const metaChips = [
    buildMetaChip('Öğrenci', studentName),
    buildMetaChip('Sınıf', className),
    buildMetaChip('Öğretmen', teacherName),
    buildMetaChip('Tarih', weekRange)
  ].join('');

  const items: any[] = Array.isArray(schedule?.study_schedule_items)
    ? schedule.study_schedule_items
    : [];

  const dayColumns = DAY_LABELS.map((day, index) => {
    const dayItems = items
      .filter(item => item?.day_of_week === day.value)
      .sort((a, b) => textOrFallback(a?.start_time).localeCompare(textOrFallback(b?.start_time)));

    const headerColor = DAY_COLORS[index % DAY_COLORS.length];
    const dayContent = dayItems.length
      ? dayItems
          .map(item => {
            const timeRange = [textOrFallback(item?.start_time), textOrFallback(item?.end_time)]
              .filter(Boolean)
              .join(' - ');

            const fields: string[] = [];
            if (item?.topic) {
              fields.push(`<div style="color:#4B5563;font-size:12px;"><strong>Konu:</strong> ${escapeHtml(textOrFallback(item.topic))}</div>`);
            }
            if (item?.goal) {
              fields.push(`<div style="color:#4B5563;font-size:12px;"><strong>Hedef:</strong> ${escapeHtml(textOrFallback(item.goal))}</div>`);
            }
            if (item?.description) {
              fields.push(`<div style="color:#4B5563;font-size:12px;">${escapeHtml(textOrFallback(item.description))}</div>`);
            }
            if (item?.resources) {
              fields.push(`<div style="color:#2563EB;font-size:11px;"><strong>Kaynak:</strong> ${escapeHtml(textOrFallback(item.resources))}</div>`);
            }

            return `
              <div style="
                background: rgba(255, 255, 255, 0.85);
                border-radius: 12px;
                padding: 12px 14px;
                border: 1px solid rgba(148, 163, 184, 0.35);
                box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
                display: flex;
                flex-direction: column;
                gap: 6px;
              ">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                  <div style="font-weight:600;color:#111827;font-size:13px;">
                    ${escapeHtml(textOrFallback(item?.subject) || 'Belirtilmemiş ders')}
                  </div>
                  ${timeRange ? `<div style="font-size:12px;color:#4338CA;font-weight:600;">${escapeHtml(timeRange)}</div>` : ''}
                </div>
                ${fields.join('')}
              </div>
            `;
          })
          .join('')
      : `
          <div style="
            background: rgba(255,255,255,0.7);
            border-radius: 10px;
            padding: 14px;
            border: 1px dashed rgba(148, 163, 184, 0.6);
            color: #4B5563;
            font-size: 12px;
            text-align: center;
          ">
            Bu gün için planlanmış çalışma bulunmuyor.
          </div>
        `;

    return `
      <div style="
        flex: 1 1 30%;
        min-width: 280px;
        background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}CC 45%, rgba(255,255,255,0.96) 100%);
        border-radius: 18px;
        padding: 18px;
        color: #1e293b;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 12px 25px rgba(15, 23, 42, 0.12);
      ">
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          color:#fff;
          font-weight:700;
          letter-spacing:0.4px;
          text-transform:uppercase;
          font-size:13px;
          text-shadow: 0 2px 6px rgba(0,0,0,0.18);
        ">
          <span>${escapeHtml(day.label)}</span>
          <span style="font-weight:500;font-size:12px;opacity:0.85;">${escapeHtml(dayItems.length.toString())} görev</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${dayContent}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="
      width: 1400px;
      padding: 32px;
      background: #F8FAFC;
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      color: #0F172A;
    ">
      <div style="
        background: linear-gradient(135deg, #312E81, #4338CA);
        border-radius: 24px;
        padding: 28px;
        color: white;
        box-shadow: 0 20px 45px rgba(30, 64, 175, 0.35);
        margin-bottom: 28px;
      ">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:28px;font-weight:700;letter-spacing:0.3px;">${escapeHtml(title)}</div>
          <div style="font-size:15px;font-weight:500;opacity:0.9;">${escapeHtml(weekRange)}</div>
          <div style="margin-top:6px;">${metaChips}</div>
        </div>
      </div>

      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:18px;
      ">
        ${dayColumns}
      </div>

      <div style="margin-top:32px;font-size:11px;color:#475569;text-align:right;">
        PDF oluşturuldu: ${new Date().toLocaleString('tr-TR')}
      </div>
    </div>
  `;
};

export async function exportStudySchedulePdf(schedule: any, options: ExportScheduleOptions = {}) {
  if (!schedule) return;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '0';
  container.style.zIndex = '-1';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.innerHTML = createScheduleHtml(schedule, options);

  document.body.appendChild(container);

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => resolve());
  });

  const element = container.firstElementChild as HTMLElement | null;
  if (!element) {
    document.body.removeChild(container);
    return;
  }

  const canvas = await html2canvas(element, {
    scale: window.devicePixelRatio < 2 ? 2 : window.devicePixelRatio,
    backgroundColor: '#ffffff'
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;
  position -= pdfHeight;

  while (heightLeft > 0) {
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    position -= pdfHeight;
  }

  const title = textOrFallback(schedule?.title) || 'Haftalık Çalışma Programı';
  const weekRange =
    schedule?.week_start_date && schedule?.week_end_date
      ? `${formatDate(schedule.week_start_date)} - ${formatDate(schedule.week_end_date)}`
      : '';

  const filenameParts = [
    slugify(title),
    textOrFallback(options.studentName || schedule?.student?.profile?.full_name),
    weekRange.replace(/\s+/g, '_')
  ].filter(Boolean);

  const filename = `${filenameParts.join('-') || 'calisma-programi'}.pdf`;
  pdf.save(filename);
}
