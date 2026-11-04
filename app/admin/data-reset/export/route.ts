import {audit} from "@/server/private-client/repository";
import {NextResponse} from "next/server";
import {getSession} from "@/features/auth/session";
import {exportDemoDataSnapshot} from "@/server/repositories/data-reset";

export async function GET() {
  const user = await getSession();
  if (user?.role !== "Super Admin") return NextResponse.json({error: "Forbidden"}, {status: 403});
  const snapshot = exportDemoDataSnapshot();
  audit(user.id,"demo_snapshot","all","downloaded demo snapshot");
  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "content-disposition": `attachment; filename="morifar-demo-data-${snapshot.exportedAt.slice(0, 10)}.json"`,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

