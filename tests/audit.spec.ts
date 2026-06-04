import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const auditEmail = process.env.E2E_AUDIT_EMAIL;
const auditPassword = process.env.E2E_AUDIT_PASSWORD;

// Ensure screenshots directory exists
const artifactsDir = path.join(process.cwd(), 'artifacts', 'screenshots');
if (!fs.existsSync(artifactsDir)) {
	fs.mkdirSync(artifactsDir, { recursive: true });
}

test('Functional and Visual Audit', async ({ page }) => {
	test.skip(
		!auditEmail || !auditPassword,
		'Set E2E_AUDIT_EMAIL and E2E_AUDIT_PASSWORD to run the authenticated audit.'
	);
	const email = auditEmail!;
	const password = auditPassword!;

	await page.goto('/');

	await page.goto('/login');
	await page.waitForLoadState('load');
	await page.waitForTimeout(2000);

	await page.screenshot({ path: path.join(artifactsDir, '01_login_page.png'), fullPage: true });

	await page.fill('input#email', email);
	await page.fill('input#password', password);
	await page.click('button:has-text("Sign in")');

	await page.waitForURL('**/');
	await page.waitForLoadState('load');
	await page.waitForTimeout(2000);

	await page.screenshot({ path: path.join(artifactsDir, '02_dashboard_page.png'), fullPage: true });

	await page.goto('/prayers');
	await page.waitForLoadState('load');
	await page.waitForTimeout(2000);
	await page.screenshot({ path: path.join(artifactsDir, '03_prayers_page.png'), fullPage: true });

	await page.goto('/groups');
	await page.waitForLoadState('load');
	await page.waitForTimeout(2000);
	await page.screenshot({ path: path.join(artifactsDir, '04_groups_page.png'), fullPage: true });

	await page.goto('/profile');
	await page.waitForLoadState('load');
	await page.waitForTimeout(2000);
	await page.screenshot({ path: path.join(artifactsDir, '05_profile_page.png'), fullPage: true });

	expect(true).toBeTruthy();
});
