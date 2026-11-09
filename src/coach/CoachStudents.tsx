import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { appPath } from "../routes";
import { NAVY, GOLD } from "../theme";

type StudentRow = {
  profileId: string;
  email: string | null;
  fullName: string | null;
  libraries: { id: string; title: string }[];
  enrolledAt: string | null;
};

type Props = {
  profileId: string;
};

export default function CoachStudents({ profileId }: Props) {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: libs, error: libErr } = await supabase
      .from("knowledge_libraries")
      .select("id, title")
      .eq("owner_id", profileId);
    if (libErr) {
      setError(libErr.message);
      setRows([]);
      setLoading(false);
      return;
    }
    const libraryList = (libs || []) as { id: string; title: string }[];
    if (!libraryList.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    const libById = new Map(libraryList.map((l) => [l.id, l.title]));
    const libIds = libraryList.map((l) => l.id);

    const { data: enrolls, error: enErr } = await supabase
      .from("library_enrollments")
      .select("library_id, profile_id, created_at")
      .in("library_id", libIds)
      .order("created_at", { ascending: false });
    if (enErr) {
      setError(enErr.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const byStudent = new Map<
      string,
      { libraries: { id: string; title: string }[]; enrolledAt: string | null }
    >();
    for (const e of enrolls || []) {
      const pid = e.profile_id as string;
      const lid = e.library_id as string;
      const title = libById.get(lid) || "Library";
      const cur = byStudent.get(pid) || { libraries: [], enrolledAt: null };
      if (!cur.libraries.some((l) => l.id === lid)) {
        cur.libraries.push({ id: lid, title });
      }
      const created = e.created_at ? String(e.created_at) : null;
      if (created && (!cur.enrolledAt || created > cur.enrolledAt)) {
        cur.enrolledAt = created;
      }
      byStudent.set(pid, cur);
    }

    const ids = [...byStudent.keys()];
    if (!ids.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids);
    if (pErr) {
      setError(pErr.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const list: StudentRow[] = (profs || []).map((p) => {
      const agg = byStudent.get(p.id as string)!;
      return {
        profileId: p.id as string,
        email: (p.email as string | null) ?? null,
        fullName: (p.full_name as string | null) ?? null,
        libraries: agg.libraries,
        enrolledAt: agg.enrolledAt,
      };
    });
    list.sort((a, b) =>
      (a.fullName || a.email || a.profileId).localeCompare(b.fullName || b.email || b.profileId)
    );
    setRows(list);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, margin: "0 0 8px", color: NAVY }}>
        Students
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px", lineHeight: 1.5 }}>
        Trainees enrolled in at least one of your libraries. Enroll someone from a library&apos;s detail page.
      </p>

      {loading ? (
        <p style={{ color: "#6B7280" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "#7A2E3A" }}>{error}</p>
      ) : rows.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #E2DFD6",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p style={{ margin: "0 0 12px", fontSize: 14, color: NAVY, lineHeight: 1.5 }}>
            No students yet. Create a library, activate it, then enroll trainees by email.
          </p>
          <Link
            to={appPath("/coach/libraries")}
            style={{
              display: "inline-block",
              padding: "10px 16px",
              borderRadius: 8,
              background: GOLD,
              color: NAVY,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Go to libraries
          </Link>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li
              key={r.profileId}
              style={{
                background: "#fff",
                border: "1px solid #E2DFD6",
                borderRadius: 12,
                padding: "16px 18px",
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>
                {r.fullName || r.email || "Trainee"}
              </div>
              {r.email && r.fullName ? (
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{r.email}</div>
              ) : null}
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {r.libraries.map((l) => (
                  <Link
                    key={l.id}
                    to={appPath(`/coach/libraries/${l.id}`)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: NAVY,
                      background: "#FFF4EC",
                      borderRadius: 6,
                      padding: "4px 8px",
                      textDecoration: "none",
                    }}
                  >
                    {l.title}
                  </Link>
                ))}
              </div>
              {r.enrolledAt ? (
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
                  Latest enrollment {new Date(r.enrolledAt).toLocaleDateString()}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
