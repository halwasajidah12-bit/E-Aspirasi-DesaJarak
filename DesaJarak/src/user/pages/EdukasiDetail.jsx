import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { CheckCircle2, Star, Home, Users, FileCheck, Building2, Palette, Store } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { sortEducationModules } from "../../data/education.js";
import { getEducation } from "../../utils/api.js";

const icons = { home: Home, users: Users, "file-check": FileCheck };
const priorityIcons = { Infrastruktur: Building2, Budaya: Palette, UMKM: Store };

export default function EdukasiDetail() {
  const { slug } = useParams();
  const [edukasiList, setEdukasiList] = useState(() => sortEducationModules([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const refreshEducation = () => {
      getEducation()
        .then((items) => {
          if (mounted) {
            setEdukasiList(sortEducationModules(items.filter((item) => item.status === "Publish")));
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setLoading(false);
        });
    };
    refreshEducation();
    const interval = setInterval(refreshEducation, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const data = edukasiList.find((item) => item.slug === slug);

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Memuat edukasi...</div>;
  if (!data) return <Navigate to="/edukasi" replace />;

  return (
    <div className="pb-8">
      <PageHeader title={data.title} subtitle={data.subtitle} />

      <div className="px-4 sm:px-6 mt-3.5 space-y-3.5">
        {data.image && <img src={data.image} alt={data.title} className="w-full max-h-72 rounded-2xl object-cover border border-emerald-100 shadow-sm" />}
        {data.content ? (
          <section className="space-y-3">
            {data.content.split(/\n\s*\n/).filter(Boolean).map((block, index) => {
              const lines = block.split("\n").filter(Boolean);
              if (lines.every((line) => line.startsWith("- "))) {
                return <ul key={index} className="space-y-2 list-disc pl-5 text-sm text-gray-700">{lines.map((line, lineIndex) => <li key={lineIndex}>{line.slice(2)}</li>)}</ul>;
              }
              if (block.startsWith("## ")) return <h2 key={index} className="text-sm font-bold text-emerald-900">{block.slice(3)}</h2>;
              return <p key={index} className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{block}</p>;
            })}
          </section>
        ) : data.sections?.map((s, si) => (
          <section key={si}>
            <h2 className="text-sm font-bold text-emerald-900 mb-2">{s.heading}</h2>

            {s.paragraphs?.map((p, i) => (
              <p key={i} className="text-sm text-gray-600 leading-relaxed mb-2">
                {p}
              </p>
            ))}

            {s.twoCol && (
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {s.twoCol.map((c, i) => (
                  <div key={i} className="bg-white border border-emerald-100 shadow-sm rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        {(() => { const Icon = c.icon || Users; return <Icon size={16} /> })()}
                      </span>
                      <span className="font-bold text-xs text-gray-800">{c.title}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {s.bullets && (
              <ul className="space-y-2 mt-2">
                {s.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 size={16} className="text-brand-700 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {s.steps && (
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {s.steps.map((st, i) => (
                  <div key={i} className="bg-white border border-emerald-100 shadow-sm rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-xs text-gray-800">{st.title}</span>
                      <span className="h-5 w-5 rounded-full bg-brand-700 text-white text-xs flex items-center justify-center shrink-0">
                        {st.badge ?? i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {s.priorities && (
              <div className="grid grid-cols-3 gap-3 mt-2">
                {s.priorities.map((p, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-1.5">
                    <span className="h-12 w-12 rounded-2xl bg-emerald-600 text-white shadow-sm flex items-center justify-center">
                      {(() => { const Icon = p.icon || priorityIcons[p.title] || FileCheck; return <Icon size={22} /> })()}
                    </span>
                    <p className="text-xs font-bold text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-600 leading-snug">{p.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {s.checklist && (
              <div className="space-y-3 mt-2">
                {s.checklist.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-brand-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{c.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {s.sanksi && (
              <div className="space-y-3 mt-2">
                {s.sanksi.map((sk, i) => (
                  <div key={i} className={`${sk.color} rounded-2xl p-4 text-white`}>
                    <p className="font-semibold">{sk.title}</p>
                    <p className="text-sm text-white/85 mt-0.5">{sk.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {s.tips && (
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-4 mt-2 shadow-sm">
                <p className="font-semibold text-white mb-2">Tips</p>
                <ul className="space-y-2">
                  {s.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                      <Star size={14} className="text-amber-400 mt-0.5 shrink-0" fill="currentColor" />
                      {t}
                    </li>
                  ))}
                </ul>
                {s.tipsNote && (
                  <p className="text-xs text-white/80 mt-3 pt-3 border-t border-white/15 leading-relaxed">
                    {s.tipsNote.before}
                    <Link to={s.tipsNote.linkTo} className="underline font-medium text-white">
                      {s.tipsNote.linkText}
                    </Link>
                    {s.tipsNote.after}
                  </p>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
