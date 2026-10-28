import { auth } from "./auth";

export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: ["/", "/dashboard/:path*", "/accounts/:path*", "/categories/:path*", "/transactions/:path*", "/budgets/:path*"],
};
