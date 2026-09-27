import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home, Users, FileCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { initialEducationModules, sortEducationModules } from "../../data/education.js";
import { getEducation } from "../../utils/api.js";

const icons = { home: Home, users: Users, "file-check": FileCheck };

export default function Edukasi() {
  const [edukasiList, setEdukasiList] = useState(() => sortEducationModules(initialEducationModules));

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

      <div className="px-4 sm:px-6 -mt-[140px] grid gap-3 md:grid-cols-2">
        {edukasiList.map((item) => {
          const Icon = icons[item.iconName] || FileCheck;
          return (
          <Link
            key={item.id}
            to={`/edukasi/${item.slug}`}
            className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
          >
            <span className="h-11 w-11 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0">
              <Icon size={20} />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <ChevronRight size={18} className="text-brand-700" />
          </Link>
          );
        })}
      </div>
    </div>
  );
}
