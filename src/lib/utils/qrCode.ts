import QRCode from 'qrcode';

interface QRCodeOptions {
	width?: number;
	margin?: number;
	color?: { dark?: string; light?: string };
}

export async function generateQRCodeWithLogo(
	data: string,
	options: QRCodeOptions = {}
): Promise<string> {
	const { width = 256, margin = 2, color } = options;

	const canvas = document.createElement('canvas');
	await QRCode.toCanvas(canvas, data, {
		width,
		margin,
		errorCorrectionLevel: 'H',
		...(color && { color })
	});

	const ctx = canvas.getContext('2d');
	if (!ctx) return canvas.toDataURL();

	const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = '/prayer_icon_logo_192.png';
	});

	const logoSize = Math.round(canvas.width * 0.22);
	const logoX = (canvas.width - logoSize) / 2;
	const logoY = (canvas.height - logoSize) / 2;
	const cornerRadius = logoSize * 0.2;
	const padding = 4;

	ctx.fillStyle = color?.light ?? '#ffffff';
	ctx.beginPath();
	ctx.roundRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, cornerRadius + padding);
	ctx.fill();

	ctx.save();
	ctx.beginPath();
	ctx.roundRect(logoX, logoY, logoSize, logoSize, cornerRadius);
	ctx.clip();
	ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
	ctx.restore();

	return canvas.toDataURL();
}
