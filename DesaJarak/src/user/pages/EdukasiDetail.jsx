import { useParams, Navigate, Link } from "react-router-dom";
import { CheckCircle2, Star } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { edukasiList } from "../data/edukasi";

export default function EdukasiDetail() {
  const { slug } = useParams();
  const data = edukasiList.find((e) => e.slug === slug);

  if (!data) return <Navigate to="/edukasi" replace />;

  return (
    <div className="pb-8">
      <PageHeader title={data.judul} subtitle={data.subtitle} />

      <div className="px-4 sm:px-6 -mt-[140px] space-y-5">
        {data.sections.map((s, si) => (
          <section key={si}>
            <h2 className="font-bold text-black mb-2">{s.heading}</h2>

            {s.paragraphs?.map((p, i) => (
              <p key={i} className="text-sm text-black-500 leading-relaxed mb-2">
                {p}
              </p>
            ))}

            {s.twoCol && (
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {s.twoCol.map((c, i) => (
                  <div key={i} className="border border-brand-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="h-8 w-8 rounded-full bg-brand-100 text-black-700 flex items-center justify-center shrink-0">
                        <c.icon size={16} />
                      </span>
                      <span className="font-semibold text-sm text-black-800">{c.title}</span>
                    </div>
                    <p className="text-xs text-black-500 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {s.bullets && (
              <ul className="space-y-2 mt-2">
                {s.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-black-700">
                    <CheckCircle2 size={16} className="text-brand-700 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {s.steps && (
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {s.steps.map((st, i) => (
                  <div key={i} className="border border-brand-100 rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-sm text-black-800">{st.title}</span>
                      <span className="h-5 w-5 rounded-full bg-brand-700 text-white text-xs flex items-center justify-center shrink-0">
                        {st.badge ?? i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-black-500 leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {s.priorities && (
              <div className="grid grid-cols-3 gap-3 mt-2">
                {s.priorities.map((p, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-1.5">
                    <span className="h-12 w-12 rounded-2xl bg-brand-700 text-white flex items-center justify-center">
                      <p.icon size={22} />
                    </span>
                    <p className="text-sm font-semibold text-black-800">{p.title}</p>
                    <p className="text-xs text-black-500 leading-snug">{p.desc}</p>
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
                      <p className="text-sm font-semibold text-black-800">{c.title}</p>
                      <p className="text-xs text-black-500 leading-relaxed mt-0.5">{c.desc}</p>
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
              <div className="bg-brand-700 rounded-2xl p-4 mt-2">
                <p className="font-semibold text-white mb-2">Tips</p>
                <ul className="space-y-2">
                  {s.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                      <Star size={14} className="text-accent-500 mt-0.5 shrink-0" fill="currentColor" />
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