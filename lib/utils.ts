/** Convert any YouTube URL to embed format */
export function toEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([^&\s?#]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

/** Generate a unique video watch key */
export function videoKey(topicId: string, index: number): string {
  return `${topicId}_${index}`;
}

/** File type icon */
export function fileIcon(type: string): string {
  return type === 'pdf' ? '📄' : type === 'doc' ? '📝' : '📊';
}

/** Fisher-Yates shuffle — returns a new shuffled array */
export function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Detect file type from filename */
export function fileType(name: string): 'pdf' | 'doc' | 'ppt' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  return 'doc';
}
