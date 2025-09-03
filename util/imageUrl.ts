import supabase from '../lib/supabase/admin'

export function imageUrl(bucket: string, path: string, w = 1200): string {
	const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
		transform: { width: w, quality: 80 },
	})
	return data.publicUrl
}
