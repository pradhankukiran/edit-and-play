export async function grabFrame(video: HTMLVideoElement): Promise<Blob | null> {
	const width = video.videoWidth;
	const height = video.videoHeight;
	if (width === 0 || height === 0) return null;

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	ctx.drawImage(video, 0, 0);

	return new Promise<Blob | null>((resolve) => {
		canvas.toBlob((blob) => resolve(blob), 'image/png');
	});
}
