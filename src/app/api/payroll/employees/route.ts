import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const employees = await client.query((anyApi as any).employees.listByCompany, { companyId });
    return securityHeaders(NextResponse.json({ ok: true, employees }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load employees" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { action } = body ?? {};

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (action === "add") {
      const { companyId, name, role, payRate, hoursPerPeriod, allocation } = body;
      if (!companyId || !name?.trim() || !role?.trim() || typeof payRate !== "number") {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing companyId, name, role, or payRate" }, { status: 400 })
        );
      }
      const employeeId = await client.mutation((anyApi as any).employees.addEmployee, {
        companyId,
        name,
        role,
        payRate,
        hoursPerPeriod: typeof hoursPerPeriod === "number" ? hoursPerPeriod : 160,
        allocation: typeof allocation === "number" ? allocation : 100,
      });
      return securityHeaders(NextResponse.json({ ok: true, employeeId }));
    }

    if (action === "update") {
      const { employeeId, ...updates } = body;
      if (!employeeId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing employeeId" }, { status: 400 })
        );
      }
      const allowed = ["name", "role", "payRate", "hoursPerPeriod", "allocation"] as const;
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) patch[key] = updates[key];
      }
      const employee = await client.mutation((anyApi as any).employees.updateEmployee, {
        employeeId,
        ...patch,
      });
      return securityHeaders(NextResponse.json({ ok: true, employee }));
    }

    if (action === "remove") {
      const { employeeId } = body;
      if (!employeeId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing employeeId" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).employees.removeEmployee, { employeeId });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update employees" },
        { status: 500 }
      )
    );
  }
});
