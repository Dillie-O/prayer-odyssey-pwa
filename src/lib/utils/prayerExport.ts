import { auth, db } from '$lib/firebase';
import {
	collection,
	getDocs,
	orderBy,
	query,
	where,
	Timestamp,
	type QueryConstraint
} from 'firebase/firestore';

export type PrayerExportFormat = 'json' | 'csv' | 'markdown' | 'docx' | 'print';

export interface ExportPrayerUpdate {
	id: string;
	prayerId: string;
	content: string;
	authorId: string;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface ExportPrayer {
	id: string;
	summary: string;
	description: string;
	status: 'active' | 'answered' | 'archived';
	createdAt: string | null;
	updatedAt: string | null;
	sharedWith: string[];
	prayedCount: number;
	prayedByCount: number;
	updatesCount: number;
	updates: ExportPrayerUpdate[];
}

export interface PrayerExportSummary {
	totalPrayers: number;
	activePrayers: number;
	answeredPrayers: number;
	archivedPrayers: number;
	totalUpdates: number;
	totalPrayedCount: number;
	dateRangeStart: string | null;
	dateRangeEnd: string | null;
	exportedAt: string;
	appVersion: string;
}

export interface PrayerExportData {
	user: {
		uid: string;
		displayName: string;
		email: string;
	};
	summary: PrayerExportSummary;
	prayers: ExportPrayer[];
}

export interface PrayerExportDateRange {
	startDate?: string | null;
	endDate?: string | null;
}

const EXPORT_TITLE = 'Prayer Odyssey Journal Export';
const BLOB_URL_CLEANUP_DELAY_MS = 60_000;
const DOWNLOAD_BLOB_URL_CLEANUP_DELAY_MS = 1_000;

const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

const formatDisplayDate = (value: string | null) => {
	if (!value) return '—';

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const formatDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const timestampToIso = (value: Timestamp | { toDate: () => Date } | null | undefined) => {
	if (!value || typeof value.toDate !== 'function') return null;
	return value.toDate().toISOString();
};

const parseDateInput = (value: string | null | undefined, endOfDay = false) => {
	if (!value) return null;
	const parsed = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDateRange = (dateRange?: PrayerExportDateRange) => {
	const startDate = parseDateInput(dateRange?.startDate ?? null);
	const endDate = parseDateInput(dateRange?.endDate ?? null, true);
	return { startDate, endDate };
};

const formatDateRange = (startDate: string | null, endDate: string | null) => {
	const start = startDate ? formatDateOnly(new Date(startDate)) : null;
	const end = endDate ? formatDateOnly(new Date(endDate)) : null;
	if (start && end) return `${start} to ${end}`;
	if (start) return `From ${start}`;
	if (end) return `Through ${end}`;
	return 'All dates';
};

const csvEscape = (value: string | number | null | undefined) =>
	`"${String(value ?? '').replaceAll('"', '""')}"`;

const buildCsv = (headers: string[], rows: Array<Array<string | number | null | undefined>>) =>
	[headers.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');

const downloadBlob = (blob: Blob, fileName: string) => {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.append(link);
	link.click();
	link.remove();

	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, DOWNLOAD_BLOB_URL_CLEANUP_DELAY_MS);
};

const buildBaseFileName = (exportedAt: string) =>
	`prayer-odyssey-export-${formatDateOnly(new Date(exportedAt))}`;

const buildMarkdown = (data: PrayerExportData) => {
	const lines: string[] = [
		`# ${EXPORT_TITLE}`,
		'',
		`**Name:** ${data.user.displayName}`,
		`**Email:** ${data.user.email}`,
		`**Exported:** ${formatDisplayDate(data.summary.exportedAt)}`,
		`**App version:** ${data.summary.appVersion}`,
		'',
		'## Summary',
		'',
		`- Total prayers: ${data.summary.totalPrayers}`,
		`- Active prayers: ${data.summary.activePrayers}`,
		`- Answered prayers: ${data.summary.answeredPrayers}`,
		`- Archived prayers: ${data.summary.archivedPrayers}`,
		`- Total updates: ${data.summary.totalUpdates}`,
		`- Total prayed count: ${data.summary.totalPrayedCount}`,
		`- Date range: ${formatDateRange(data.summary.dateRangeStart, data.summary.dateRangeEnd)}`,
		''
	];

	if (data.prayers.length === 0) {
		lines.push('## Prayers', '', '_No prayers yet._');
		return lines.join('\n');
	}

	lines.push('## Prayers', '');

	for (const prayer of data.prayers) {
		lines.push(`### ${prayer.summary || 'Untitled Prayer'}`, '');
		lines.push(`- Status: ${prayer.status}`);
		lines.push(`- Created: ${formatDisplayDate(prayer.createdAt)}`);
		lines.push(`- Updated: ${formatDisplayDate(prayer.updatedAt)}`);
		lines.push(`- Prayer count: ${prayer.prayedCount}`);
		lines.push(
			`- Shared with groups: ${prayer.sharedWith.length > 0 ? prayer.sharedWith.join(', ') : 'None'}`
		);
		lines.push('');

		if (prayer.description) {
			lines.push(prayer.description, '');
		}

		if (prayer.updates.length === 0) {
			lines.push('#### Updates', '', '_No updates yet._', '');
			continue;
		}

		lines.push('#### Updates', '');
		for (const update of prayer.updates) {
			lines.push(`- ${formatDisplayDate(update.createdAt)} — ${update.content}`);
		}
		lines.push('');
	}

	return lines.join('\n');
};

const buildPrintHtml = (data: PrayerExportData) => {
	const prayersMarkup =
		data.prayers.length === 0
			? '<p class="empty">No prayers yet.</p>'
			: data.prayers
					.map(
						(prayer) => `
							<section class="prayer">
								<h2>${escapeHtml(prayer.summary || 'Untitled Prayer')}</h2>
								<div class="meta-grid">
									<p><strong>Status:</strong> ${escapeHtml(prayer.status)}</p>
									<p><strong>Prayer count:</strong> ${prayer.prayedCount}</p>
									<p><strong>Created:</strong> ${escapeHtml(formatDisplayDate(prayer.createdAt))}</p>
									<p><strong>Updated:</strong> ${escapeHtml(formatDisplayDate(prayer.updatedAt))}</p>
								</div>
								<p><strong>Shared with groups:</strong> ${escapeHtml(prayer.sharedWith.length > 0 ? prayer.sharedWith.join(', ') : 'None')}</p>
								${prayer.description ? `<p class="description">${escapeHtml(prayer.description).replaceAll('\n', '<br>')}</p>` : ''}
								<div class="updates">
									<h3>Updates</h3>
									${
										prayer.updates.length === 0
											? '<p class="empty">No updates yet.</p>'
											: prayer.updates
													.map(
														(update) => `
															<article class="update">
																<p class="update-date">${escapeHtml(formatDisplayDate(update.createdAt))}</p>
																<p>${escapeHtml(update.content).replaceAll('\n', '<br>')}</p>
															</article>
														`
													)
													.join('')
									}
								</div>
							</section>
						`
					)
					.join('');

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${escapeHtml(EXPORT_TITLE)}</title>
		<style>
			:root {
				color-scheme: light;
				font-family: Inter, Arial, sans-serif;
			}
			body {
				margin: 0;
				background: #f8fafc;
				color: #0f172a;
			}
			.toolbar {
				position: sticky;
				top: 0;
				display: flex;
				gap: 0.75rem;
				align-items: center;
				justify-content: space-between;
				padding: 1rem 1.5rem;
				background: rgba(255, 255, 255, 0.95);
				border-bottom: 1px solid #cbd5e1;
				backdrop-filter: blur(10px);
			}
			.toolbar button {
				border: 0;
				border-radius: 0.75rem;
				background: #4f46e5;
				color: white;
				font: inherit;
				padding: 0.75rem 1rem;
				cursor: pointer;
			}
			.toolbar p {
				margin: 0;
				color: #475569;
				font-size: 0.95rem;
			}
			main {
				max-width: 8.5in;
				margin: 0 auto;
				padding: 2rem 1.25rem 4rem;
			}
			.panel {
				background: white;
				border: 1px solid #cbd5e1;
				border-radius: 1rem;
				padding: 1.5rem;
				box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
			}
			h1,
			h2,
			h3,
			p {
				margin-top: 0;
			}
			.summary-grid,
			.meta-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
				gap: 0.75rem;
			}
			.summary-grid p,
			.meta-grid p {
				margin-bottom: 0;
			}
			.prayer {
				margin-top: 1.5rem;
				padding-top: 1.5rem;
				border-top: 1px solid #e2e8f0;
				break-inside: avoid;
				page-break-inside: avoid;
			}
			.prayer:first-of-type {
				border-top: 0;
				padding-top: 0;
				margin-top: 0;
			}
			.description,
			.update {
				border-radius: 0.75rem;
				background: #f8fafc;
				padding: 1rem;
				border: 1px solid #e2e8f0;
			}
			.update + .update {
				margin-top: 0.75rem;
			}
			.update-date {
				color: #475569;
				font-size: 0.9rem;
			}
			.empty {
				color: #64748b;
				font-style: italic;
			}
			@media print {
				body {
					background: white;
				}
				.toolbar {
					display: none;
				}
				main {
					max-width: none;
					padding: 0;
				}
				.panel {
					border: 0;
					box-shadow: none;
					padding: 0;
				}
			}
		</style>
	</head>
	<body>
		<div class="toolbar">
			<p>Use your browser's print flow to print this journal or save it as a PDF.</p>
			<div>
				<button type="button" onclick="window.print()">Print or Save as PDF</button>
			</div>
		</div>
		<main>
			<div class="panel">
				<h1>${escapeHtml(EXPORT_TITLE)}</h1>
				<p><strong>Name:</strong> ${escapeHtml(data.user.displayName)}</p>
				<p><strong>Email:</strong> ${escapeHtml(data.user.email)}</p>
				<p><strong>Exported:</strong> ${escapeHtml(formatDisplayDate(data.summary.exportedAt))}</p>
				<p><strong>App version:</strong> ${escapeHtml(data.summary.appVersion)}</p>
				<section>
					<h2>Summary</h2>
					<div class="summary-grid">
						<p><strong>Total prayers:</strong> ${data.summary.totalPrayers}</p>
						<p><strong>Active prayers:</strong> ${data.summary.activePrayers}</p>
						<p><strong>Answered prayers:</strong> ${data.summary.answeredPrayers}</p>
						<p><strong>Archived prayers:</strong> ${data.summary.archivedPrayers}</p>
						<p><strong>Total updates:</strong> ${data.summary.totalUpdates}</p>
						<p><strong>Total prayed count:</strong> ${data.summary.totalPrayedCount}</p>
						<p><strong>Date range:</strong> ${escapeHtml(formatDateRange(data.summary.dateRangeStart, data.summary.dateRangeEnd))}</p>
					</div>
				</section>
				<section>
					<h2>Prayers</h2>
					${prayersMarkup}
				</section>
			</div>
		</main>
	</body>
</html>`;
};

export const openPrayerExportLoadingWindow = () => {
	const loadingWindow = window.open('', '_blank');
	if (!loadingWindow) return null;

	loadingWindow.document.write(`<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Preparing prayer export…</title>
		<style>
			body {
				margin: 0;
				display: grid;
				place-items: center;
				min-height: 100vh;
				font-family: Inter, Arial, sans-serif;
				background: #f8fafc;
				color: #0f172a;
			}
			p {
				margin: 0;
				padding: 1.5rem;
				border-radius: 1rem;
				background: white;
				border: 1px solid #cbd5e1;
				box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
			}
		</style>
	</head>
	<body>
		<p>Preparing your print-ready journal…</p>
	</body>
</html>`);
	loadingWindow.document.close();

	return loadingWindow;
};

export const fetchOwnedPrayerExportData = async (
	appVersion: string,
	dateRange?: PrayerExportDateRange
): Promise<PrayerExportData> => {
	const currentUser = auth.currentUser;
	if (!currentUser) throw new Error('User not logged in');

	const normalizedDateRange = normalizeDateRange(dateRange);
	const constraints: QueryConstraint[] = [
		where('ownerId', '==', currentUser.uid),
		orderBy('createdAt', 'desc')
	];

	if (normalizedDateRange.startDate) {
		constraints.push(where('createdAt', '>=', Timestamp.fromDate(normalizedDateRange.startDate)));
	}

	if (normalizedDateRange.endDate) {
		constraints.push(where('createdAt', '<=', Timestamp.fromDate(normalizedDateRange.endDate)));
	}

	const prayersSnapshot = await getDocs(query(collection(db, 'prayers'), ...constraints));

	const prayers = await Promise.all(
		prayersSnapshot.docs.map(async (prayerDoc) => {
			const prayerData = prayerDoc.data();
			const updatesSnapshot = await getDocs(
				query(collection(db, 'prayers', prayerDoc.id, 'updates'), orderBy('createdAt', 'asc'))
			);
			const updates = updatesSnapshot.docs.map((updateDoc) => {
				const updateData = updateDoc.data();

				return {
					id: updateDoc.id,
					prayerId: prayerDoc.id,
					content: updateData.content ?? '',
					authorId: updateData.authorId ?? '',
					createdAt: timestampToIso(updateData.createdAt),
					updatedAt: timestampToIso(updateData.updatedAt)
				} satisfies ExportPrayerUpdate;
			});

			return {
				id: prayerDoc.id,
				summary: prayerData.summary ?? '',
				description: prayerData.description ?? '',
				status: prayerData.status ?? 'active',
				createdAt: timestampToIso(prayerData.createdAt),
				updatedAt: timestampToIso(prayerData.updatedAt),
				sharedWith: Array.isArray(prayerData.sharedWith) ? prayerData.sharedWith : [],
				prayedCount: typeof prayerData.prayedCount === 'number' ? prayerData.prayedCount : 0,
				prayedByCount: Array.isArray(prayerData.prayedBy) ? prayerData.prayedBy.length : 0,
				updatesCount: updates.length,
				updates
			} satisfies ExportPrayer;
		})
	);

	const exportedAt = new Date().toISOString();
	const summary: PrayerExportSummary = {
		totalPrayers: prayers.length,
		activePrayers: prayers.filter((prayer) => prayer.status === 'active').length,
		answeredPrayers: prayers.filter((prayer) => prayer.status === 'answered').length,
		archivedPrayers: prayers.filter((prayer) => prayer.status === 'archived').length,
		totalUpdates: prayers.reduce((sum, prayer) => sum + prayer.updatesCount, 0),
		totalPrayedCount: prayers.reduce((sum, prayer) => sum + prayer.prayedCount, 0),
		dateRangeStart: normalizedDateRange.startDate?.toISOString() ?? null,
		dateRangeEnd: normalizedDateRange.endDate?.toISOString() ?? null,
		exportedAt,
		appVersion
	};

	return {
		user: {
			uid: currentUser.uid,
			displayName: currentUser.displayName ?? 'Prayer Odyssey User',
			email: currentUser.email ?? 'No email provided'
		},
		summary,
		prayers
	};
};

export const exportPrayerData = async (
	format: PrayerExportFormat,
	data: PrayerExportData,
	printWindow?: Window | null
) => {
	const baseFileName = buildBaseFileName(data.summary.exportedAt);

	if (format === 'json') {
		downloadBlob(
			new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }),
			`${baseFileName}.json`
		);
		return;
	}

	if (format === 'markdown') {
		downloadBlob(
			new Blob([buildMarkdown(data)], { type: 'text/markdown;charset=utf-8' }),
			`${baseFileName}.md`
		);
		return;
	}

	if (format === 'csv') {
		const { default: JSZip } = await import('jszip');
		const zip = new JSZip();

		zip.file(
			'summary.csv',
			buildCsv(
				[
					'totalPrayers',
					'activePrayers',
					'answeredPrayers',
					'archivedPrayers',
					'totalUpdates',
					'totalPrayedCount',
					'dateRangeStart',
					'dateRangeEnd',
					'exportedAt',
					'appVersion'
				],
				[
					[
						data.summary.totalPrayers,
						data.summary.activePrayers,
						data.summary.answeredPrayers,
						data.summary.archivedPrayers,
						data.summary.totalUpdates,
						data.summary.totalPrayedCount,
						data.summary.dateRangeStart,
						data.summary.dateRangeEnd,
						data.summary.exportedAt,
						data.summary.appVersion
					]
				]
			)
		);

		zip.file(
			'prayers.csv',
			buildCsv(
				[
					'id',
					'summary',
					'description',
					'status',
					'createdAt',
					'updatedAt',
					'sharedWith',
					'prayedCount',
					'prayedByCount',
					'updatesCount'
				],
				data.prayers.map((prayer) => [
					prayer.id,
					prayer.summary,
					prayer.description,
					prayer.status,
					prayer.createdAt,
					prayer.updatedAt,
					prayer.sharedWith.join('|'),
					prayer.prayedCount,
					prayer.prayedByCount,
					prayer.updatesCount
				])
			)
		);

		zip.file(
			'prayer_updates.csv',
			buildCsv(
				['id', 'prayerId', 'content', 'authorId', 'createdAt', 'updatedAt'],
				data.prayers.flatMap((prayer) =>
					prayer.updates.map((update) => [
						update.id,
						update.prayerId,
						update.content,
						update.authorId,
						update.createdAt,
						update.updatedAt
					])
				)
			)
		);

		const zipBlob = await zip.generateAsync({ type: 'blob' });
		downloadBlob(zipBlob, `${baseFileName}.zip`);
		return;
	}

	if (format === 'docx') {
		const { Document, HeadingLevel, Packer, PageBreak, Paragraph, TextRun } = await import('docx');
		const content: InstanceType<typeof Paragraph>[] = [
			new Paragraph({
				text: EXPORT_TITLE,
				heading: HeadingLevel.TITLE
			}),
			new Paragraph({
				children: [new TextRun({ text: `Name: ${data.user.displayName}`, bold: true })]
			}),
			new Paragraph({
				children: [new TextRun({ text: `Email: ${data.user.email}`, bold: true })]
			}),
			new Paragraph(`Exported: ${formatDisplayDate(data.summary.exportedAt)}`),
			new Paragraph(`App version: ${data.summary.appVersion}`),
			new Paragraph({
				text: 'Summary',
				heading: HeadingLevel.HEADING_1
			}),
			new Paragraph(`Total prayers: ${data.summary.totalPrayers}`),
			new Paragraph(`Active prayers: ${data.summary.activePrayers}`),
			new Paragraph(`Answered prayers: ${data.summary.answeredPrayers}`),
			new Paragraph(`Archived prayers: ${data.summary.archivedPrayers}`),
			new Paragraph(`Total updates: ${data.summary.totalUpdates}`),
			new Paragraph(`Total prayed count: ${data.summary.totalPrayedCount}`),
			new Paragraph(
				`Date range: ${formatDateRange(data.summary.dateRangeStart, data.summary.dateRangeEnd)}`
			)
		];

		if (data.prayers.length === 0) {
			content.push(
				new Paragraph({
					text: 'Prayers',
					heading: HeadingLevel.HEADING_1
				}),
				new Paragraph('No prayers yet.')
			);
		} else {
			data.prayers.forEach((prayer, index) => {
				content.push(
					new Paragraph({
						text: prayer.summary || 'Untitled Prayer',
						heading: HeadingLevel.HEADING_1
					}),
					new Paragraph(`Status: ${prayer.status}`),
					new Paragraph(`Created: ${formatDisplayDate(prayer.createdAt)}`),
					new Paragraph(`Updated: ${formatDisplayDate(prayer.updatedAt)}`),
					new Paragraph(`Prayer count: ${prayer.prayedCount}`),
					new Paragraph(
						`Shared with groups: ${prayer.sharedWith.length > 0 ? prayer.sharedWith.join(', ') : 'None'}`
					)
				);

				if (prayer.description) {
					content.push(new Paragraph(prayer.description));
				}

				content.push(
					new Paragraph({
						text: 'Updates',
						heading: HeadingLevel.HEADING_2
					})
				);

				if (prayer.updates.length === 0) {
					content.push(new Paragraph('No updates yet.'));
				} else {
					prayer.updates.forEach((update) => {
						content.push(
							new Paragraph({
								children: [
									new TextRun({ text: `${formatDisplayDate(update.createdAt)} — `, bold: true }),
									new TextRun(update.content)
								]
							})
						);
					});
				}

				if (index < data.prayers.length - 1) {
					content.push(
						new Paragraph({
							children: [new PageBreak()]
						})
					);
				}
			});
		}

		const document = new Document({
			sections: [{ children: content }]
		});
		const blob = await Packer.toBlob(document);
		downloadBlob(blob, `${baseFileName}.docx`);
		return;
	}

	const html = buildPrintHtml(data);

	if (printWindow) {
		printWindow.document.open();
		printWindow.document.write(html);
		printWindow.document.close();
		printWindow.focus();
		return;
	}

	const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
	window.open(blobUrl, '_blank');

	setTimeout(() => {
		URL.revokeObjectURL(blobUrl);
	}, BLOB_URL_CLEANUP_DELAY_MS);
};
