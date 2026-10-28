import { getNeonAuth } from "@/lib/auth";

const handler = getNeonAuth.handler();
type RouteContext = { params: Promise<{ nextauth: string[] }> };

export function GET(request: Request, context: RouteContext) {
  return handler.GET(request, { params: context.params.then(({ nextauth }) => ({ path: nextauth })) });
}

export function POST(request: Request, context: RouteContext) {
  return handler.POST(request, { params: context.params.then(({ nextauth }) => ({ path: nextauth })) });
}
