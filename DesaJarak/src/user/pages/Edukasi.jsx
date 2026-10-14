import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home, Users, FileCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { sortEducationModules } from "../../data/education.js";
import { getEducation } from "../../utils/api.js";

const icons = { home: Home, users: Users, "file-check": FileCheck };

export default function Edukasi() {
  const [edukasiList, setEdukasiList] = useState(() => sortEducationModules([]));

  useEffect(() => {
    let mounted = true;
    const refreshEducation = () => {
      getEducation()
        .then((items) => {
          if (mounted) setEdukasiList(sortEducationModules(items.filter((item) => item.status === "Publish")));
        })
        .catch(() => {});
    };
    refreshEducation();
    const interval = setInterval(refreshEducation, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="pb-8">
      <PageHeader title="Edukasi" subtitle="Pedoman untuk pengguna E-Aspirasi" />

      <div className="px-4 sm:px-6 mt-3.5 grid gap-2.5 md:grid-cols-2">
        {edukasiList.map((item) => {
          const Icon = icons[item.iconName] || FileCheck;
          return (
          <Link
            key={item.id}
            to={`/edukasi/${item.slug}`}
            className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-3.5 flex items-center gap-3 hover:bg-emerald-50 transition"
          >
            <span className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Icon size={18} />
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-emerald-600" />
          </Link>
          );
        })}
      </div>
    </div>
  );
}
