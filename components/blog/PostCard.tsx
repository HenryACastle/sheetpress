import Link from "next/link";
import { formatDate, type Post } from "@/lib/blog";

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="group relative rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]">
      <p className="text-xs text-[var(--mute)]">
        <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min read
      </p>
      <h2 className="mt-1 text-lg font-semibold leading-snug">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-[var(--accent)]">{post.title}</Link>
      </h2>
      <p className="mt-2 text-sm text-[var(--mute)]">{post.description}</p>
      <p className="mt-3 flex flex-wrap gap-1.5">
        {post.tags.map((t) => <span key={t} className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--mute)]">{t}</span>)}
      </p>
    </article>
  );
}
