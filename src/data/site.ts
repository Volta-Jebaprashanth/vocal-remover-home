export const REPO = 'Volta-Jebaprashanth/vocal-remover';
export const REPO_URL = `https://github.com/${REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases/latest`;

export const CONTACT = {
  name: 'Volta Jebaprashanth',
  email: 'voltajeba@gmail.com',
  phone: '+94 77 463 7185',
  phoneHref: 'tel:+94774637185',
  whatsapp: 'https://wa.me/94774637185',
  linkedin: 'https://www.linkedin.com/in/voltajeba',
  linkedinHandle: 'voltajeba',
  github: 'https://github.com/Volta-Jebaprashanth',
};

export interface Release {
  version: string;
  url: string;
  sizeMB: number | null;
  date: string | null;
}

// Last known-good release, used if the GitHub API is unreachable at build time.
const FALLBACK: Release = {
  version: '1.1.0',
  url: `${REPO_URL}/releases/download/v1.1.0/VocalRemoverSetup-1.1.0.exe`,
  sizeMB: 335,
  date: '2026-08-27',
};

/** Fetch the latest release at build time; the page also refreshes this client-side. */
export async function getLatestRelease(): Promise<Release> {
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers });
    if (!res.ok) return FALLBACK;
    const data = await res.json();
    const asset = (data.assets ?? []).find((a: { name: string }) => /\.exe$/i.test(a.name));
    if (!asset) return FALLBACK;
    return {
      version: String(data.tag_name).replace(/^v/, ''),
      url: asset.browser_download_url,
      sizeMB: Math.round(asset.size / 1024 / 1024),
      date: data.published_at?.slice(0, 10) ?? null,
    };
  } catch {
    return FALLBACK;
  }
}
