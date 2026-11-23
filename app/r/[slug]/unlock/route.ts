import { getPublicBySlug } from "@/lib/reports";
import { handleUnlock } from "@/lib/report-routes";

type Ctx = { params: Promise<{ slug: string }> };
export async function POST(req: Request, { params }: Ctx) {
  return handleUnlock(req, (await params).slug, getPublicBySlug);
}
