import { getPublicBySlug } from "@/lib/reports";
import { handleView } from "@/lib/report-routes";

type Ctx = { params: Promise<{ slug: string }> };
export async function GET(req: Request, { params }: Ctx) {
  return handleView(req, (await params).slug, getPublicBySlug);
}
